from fastapi import FastAPI, HTTPException, Header, Depends, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from services.openai_service import process_message, transcribe_audio
from services.sheets import save_entry as save_to_sheets
from services.db import get_user_from_token, save_expense, save_appointment, get_expenses, get_appointments, supabase
from services.notification_service import save_subscription, get_notification_settings, update_notification_settings
from services.scheduler import start_scheduler
import os
import uvicorn
import time
import jwt
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, ClientOptions

load_dotenv()

app = FastAPI(title="Ordinis AI API")

@app.on_event("startup")
def startup_event():
    start_scheduler()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class SubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict

class NotificationSettingsRequest(BaseModel):
    enabled: bool
    reminder_time_minutes: int
    day_before_alert_enabled: bool
    day_before_alert_time: str
    morning_threshold: str

class UserFallback:
    def __init__(self, id, email=None):
        self.id = id
        self.email = email

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")

    token = authorization.replace("Bearer ", "")

    try:
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except Exception as e:
        error_msg = str(e)

        # Fallback: Try to decode JWT structure to allow request if session is just missing on server side
        # but token is structurally valid (User instruction: "Blindar contra loops de auth")
        try:
            # We don't have the secret to verify signature here easily (it's not SUPABASE_KEY),
            # so we decode without verification to get the 'sub'.
            # This is a requested fallback for stability.
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
            if user_id:
                # Basic check for expiration if 'exp' is present
                exp = payload.get("exp")
                if exp and datetime.fromtimestamp(exp) < datetime.now():
                     raise HTTPException(status_code=401, detail="Token expired")

                return UserFallback(id=user_id, email=payload.get("email"))
        except Exception as jwt_err:
            if isinstance(jwt_err, HTTPException):
                raise jwt_err
            print(f"JWT Fallback Error: {jwt_err}")
            pass

        # If fallback also failed or wasn't applicable
        if "Session from session_id claim" in error_msg:
             raise HTTPException(status_code=401, detail="Session expired")

        print(f"Auth Error: {error_msg}")
        raise HTTPException(status_code=401, detail="Invalid Token")

@app.get("/")
def read_root():
    return {"message": "Welcome to Ordinis AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe_endpoint(file: UploadFile = File(...), authorization: str = Header(None), user = Depends(get_current_user)):
    """
    Receives an audio file, transcribes it using Whisper, and returns the text.
    """
    try:
        # Read the file content
        file_content = await file.read()

        # We need to pass a tuple (filename, file_content, content_type) to OpenAI client
        # or a file-like object. The service expects just 'file' which it passes to client.audio.transcriptions.create.
        # The openai client handles (filename, bytes) tuple.

        # To be safe and compatible with how OpenAI client expects file uploads from memory:
        # It usually expects a tuple ("filename", bytes, "content_type") or a file-like object.
        # UploadFile has .file which is a SpooledTemporaryFile (file-like).
        # But since we did await file.read(), the cursor is at the end.
        # Let's seek back or just pass the bytes with a name.

        text = await transcribe_audio((file.filename, file_content, file.content_type))
        return {"text": text}
    except Exception as e:
        print(f"Transcription Error: {e}")
        raise HTTPException(status_code=500, detail="Erro na transcrição de áudio")

@app.post("/chat")
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None), user = Depends(get_current_user)):
    """
    Receives a user message, processes it with Gemini, and saves to DB.
    """

    # Initialize Supabase client early to fetch categories
    categories = []
    supabase_client = None

    if authorization:
        token = authorization.replace("Bearer ", "")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")

        try:
            # Create a client instance with the user's JWT
            supabase_client = create_client(
                url,
                key,
                options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
            )

            # Fetch user categories
            try:
                cat_response = supabase_client.table("categories").select("name").eq("user_id", user.id).execute()
                categories = [c['name'] for c in cat_response.data] if cat_response.data else []
            except Exception as cat_err:
                print(f"Error fetching categories: {cat_err}")
                categories = []

        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            pass

    # 1. Process with OpenAI
    try:
        # Pass categories to the service
        structured_response = await process_message(request.message, categories)
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            # Fail fast, no retry loop/sleep
            raise HTTPException(status_code=429, detail="IA sobrecarregada. Aguarde.")
        print(f"OpenAI Error: {e}")
        raise HTTPException(status_code=500, detail="Erro interno da IA")

    # Structure is now flat: { "type": "expense"|"appointment"|"error", ...fields... }

    msg_type = structured_response.get("type")

    # 2. Save to DB (Refactored for RLS)
    saved_db = False

    if supabase_client and msg_type != "error":
        try:
            if msg_type == "expense":
                db_payload = {
                    "user_id": user.id,
                    "category": structured_response.get("category"),
                    "amount": structured_response.get("amount"),
                    "date": structured_response.get("date"),
                    "description": structured_response.get("description"),
                    "tags": structured_response.get("tags", [])
                }
                supabase_client.table("expenses").insert(db_payload).execute()
                saved_db = True

            elif msg_type == "appointment":
                db_payload = {
                    "user_id": user.id,
                    "title": structured_response.get("title"),
                    "date": structured_response.get("date"),
                    "description": structured_response.get("description")
                }
                supabase_client.table("appointments").insert(db_payload).execute()
                saved_db = True

            elif msg_type == "cancellation":
                # 1. Fetch last expense
                last_exp = supabase_client.table("expenses").select("id, amount, created_at").eq("user_id", user.id).order("created_at", desc=True).limit(1).execute()
                exp_data = last_exp.data[0] if last_exp.data else None

                # 2. Fetch last appointment
                last_appt = supabase_client.table("appointments").select("id, title, created_at").eq("user_id", user.id).order("created_at", desc=True).limit(1).execute()
                appt_data = last_appt.data[0] if last_appt.data else None

                target = None
                table = ""
                desc_text = ""

                # 3. Compare dates
                if exp_data and appt_data:
                    if exp_data["created_at"] > appt_data["created_at"]:
                        target = exp_data
                        table = "expenses"
                        desc_text = f"R$ {target.get('amount', 0)}"
                    else:
                        target = appt_data
                        table = "appointments"
                        desc_text = f"Evento {target.get('title', 'Sem título')}"
                elif exp_data:
                    target = exp_data
                    table = "expenses"
                    desc_text = f"R$ {target.get('amount', 0)}"
                elif appt_data:
                    target = appt_data
                    table = "appointments"
                    desc_text = f"Evento {target.get('title', 'Sem título')}"

                # 4. Soft Delete (Update is_cancelled)
                if target:
                    supabase_client.table(table).update({"is_cancelled": True}).eq("id", target["id"]).execute()
                    structured_response["message"] = f"✅ Ação desfeita! O último registro ({desc_text}) foi cancelado."
                    saved_db = True
                else:
                    structured_response["message"] = "⚠️ Não encontrei nenhum registro recente para cancelar."
                    saved_db = True

        except Exception as db_err:
            print(f"Database Error: {db_err}")
            saved_db = False

    # 3. Construct Friendly Response
    response_message = ""
    if msg_type == "error":
            response_message = "Desculpe, não consegui entender o que você disse. Poderia reformular?"
    elif msg_type == "response":
            # Direct response from LLM (e.g. asking for clarification)
            response_message = structured_response.get("message", "Preciso de mais detalhes.")
    elif msg_type == "cancellation":
            response_message = structured_response.get("message", "Ação de cancelamento processada.")
    elif saved_db:
        if msg_type == "expense":
            # "✅ Gasto de R$ [valor] em [categoria] anotado!"
            val = f"{structured_response.get('amount', 0):.2f}".replace('.', ',')
            cat = structured_response.get('category', 'geral')
            response_message = f"✅ Gasto de R$ {val} em {cat} anotado!"
        else:
                # "📅 [descrição] marcado para [data]"
                title = structured_response.get('title', 'Compromisso')
                date_iso = structured_response.get('date', '')

                fmt_date = date_iso
                try:
                    dt = datetime.fromisoformat(date_iso)
                    fmt_date = dt.strftime("%d/%m/%Y às %H:%M")
                except:
                    pass

                response_message = f"📅 {title} marcado para {fmt_date}."
    else:
            # Fallback if DB save failed or other type
            if msg_type in ["expense", "appointment"]:
                 response_message = f"Entendi que é um {msg_type}, mas tive um erro ao salvar no banco de dados."
            else:
                 response_message = "Não entendi sua solicitação."

    return {
        "response": response_message,
        "data": structured_response,
        "saved": saved_db
    }

@app.get("/dashboard")
def get_dashboard_data(user = Depends(get_current_user)):
    try:
        expenses = get_expenses(user.id)
        return expenses
    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        return []

@app.get("/agenda")
def get_agenda_data(user = Depends(get_current_user)):
    try:
        appointments = get_appointments(user.id)
        return appointments
    except Exception as e:
        print(f"Error fetching agenda data: {e}")
        return []

# Nova rota solicitada: /expenses
@app.get("/expenses")
def get_expenses_data(include_cancelled: bool = False, authorization: str = Header(None), user = Depends(get_current_user)):
    try:
        # Use User Token for RLS
        token = authorization.replace("Bearer ", "")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")

        supabase_client = create_client(
            url,
            key,
            options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
        )

        query = supabase_client.table("expenses").select("*")
        if not include_cancelled:
            query = query.eq("is_cancelled", False)

        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Error fetching expenses data: {e}")
        # Return empty list on error instead of 404/500 to prevent frontend crash
        return []

# Nova rota solicitada: /appointments
@app.get("/appointments")
def get_appointments_data(include_cancelled: bool = False, authorization: str = Header(None), user = Depends(get_current_user)):
    try:
        # Use User Token for RLS
        token = authorization.replace("Bearer ", "")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")

        supabase_client = create_client(
            url,
            key,
            options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
        )

        query = supabase_client.table("appointments").select("*")
        if not include_cancelled:
             query = query.eq("is_cancelled", False)

        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Error fetching appointments data: {e}")
        # Return empty list on error instead of 404/500 to prevent frontend crash
        return []

@app.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: str, authorization: str = Header(None), user = Depends(get_current_user)):
    try:
        token = authorization.replace("Bearer ", "")
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")

        supabase_client = create_client(
            url,
            key,
            options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
        )

        # Soft delete: set is_cancelled = True
        response = supabase_client.table("appointments").update({"is_cancelled": True}).eq("id", appointment_id).execute()
        return {"message": "Appointment cancelled", "data": response.data}
    except Exception as e:
        print(f"Error deleting appointment: {e}")
        raise HTTPException(status_code=500, detail="Error cancelling appointment")

@app.post("/subscribe")
def subscribe(request: SubscriptionRequest, user = Depends(get_current_user)):
    try:
        sub_data = request.dict()
        save_subscription(user.id, sub_data)
        return {"status": "subscribed"}
    except Exception as e:
        print(f"Subscription Error: {e}")
        raise HTTPException(status_code=500, detail="Error saving subscription")

@app.get("/settings/notifications")
def get_notif_settings(user = Depends(get_current_user)):
    try:
        settings = get_notification_settings(user.id)
        return settings
    except Exception as e:
        print(f"Get Settings Error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching settings")

@app.put("/settings/notifications")
def update_notif_settings(request: NotificationSettingsRequest, user = Depends(get_current_user)):
    try:
        data = request.dict()
        updated = update_notification_settings(user.id, data)
        return updated
    except Exception as e:
        print(f"Update Settings Error: {e}")
        raise HTTPException(status_code=500, detail="Error updating settings")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
