from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from services.gemini import process_message
from services.sheets import save_entry as save_to_sheets
from services.db import get_user_from_token, save_expense, save_appointment, get_expenses, get_appointments
import os
import uvicorn
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, ClientOptions

load_dotenv()

app = FastAPI(title="Ordinis AI API")

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

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")

    token = authorization.replace("Bearer ", "")
    user_response = get_user_from_token(token)

    if not user_response:
        raise HTTPException(status_code=401, detail="Invalid Token")

    return user_response.user

@app.get("/")
def read_root():
    return {"message": "Welcome to Ordinis AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/chat")
def chat_endpoint(request: ChatRequest, authorization: str = Header(None), user = Depends(get_current_user)):
    """
    Receives a user message, processes it with Gemini, and saves to DB.
    """
    try:
        # 1. Process with Gemini
        structured_response = process_message(request.message)
        # Structure: { "type": "expense"|"appointment"|"error", "data": { ... } }

        msg_type = structured_response.get("type")
        data_payload = structured_response.get("data", {})

        # 2. Save to DB (Refactored for RLS)
        saved_db = False

        # Initialize authenticated Supabase client
        if authorization:
            token = authorization.replace("Bearer ", "")
            url: str = os.environ.get("SUPABASE_URL")
            key: str = os.environ.get("SUPABASE_KEY")

            try:
                # Create a client instance with the user's JWT
                supabase = create_client(
                    url,
                    key,
                    options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
                )

                if msg_type == "expense":
                    db_payload = {
                        "user_id": user.id,
                        "category": data_payload.get("category"),
                        "amount": data_payload.get("amount"),
                        "date": data_payload.get("date"),
                        "description": data_payload.get("description"),
                        "tags": data_payload.get("tags", [])
                    }
                    supabase.table("expenses").insert(db_payload).execute()
                    saved_db = True

                elif msg_type == "appointment":
                    # Note: New prompt returns ISO date in 'date' field
                    db_payload = {
                        "user_id": user.id,
                        "title": data_payload.get("title"),
                        "date": data_payload.get("date"),
                        "description": data_payload.get("description")
                    }
                    supabase.table("appointments").insert(db_payload).execute()
                    saved_db = True

            except Exception as db_err:
                print(f"Database Error: {db_err}")
                saved_db = False

        # 3. Construct Friendly Response
        response_message = ""
        if msg_type == "error":
             response_message = "Desculpe, não consegui entender o que você disse. Poderia reformular?"
        elif saved_db:
            if msg_type == "expense":
                # "✅ Gasto de R$ [valor] em [categoria] anotado!"
                val = f"{data_payload.get('amount', 0):.2f}".replace('.', ',')
                cat = data_payload.get('category', 'geral')
                response_message = f"✅ Gasto de R$ {val} em {cat} anotado!"
            else:
                 # "📅 [descrição] marcado para [data]" (Novo prompt retorna ISO)
                 title = data_payload.get('title', 'Compromisso')
                 date_iso = data_payload.get('date', '')

                 fmt_date = date_iso
                 try:
                     dt = datetime.fromisoformat(date_iso)
                     fmt_date = dt.strftime("%d/%m/%Y às %H:%M")
                 except:
                     pass

                 response_message = f"📅 {title} marcado para {fmt_date}."
        else:
             # Fallback if DB save failed or other type
             response_message = f"Entendi que é um {msg_type}, mas tive um erro ao salvar no banco de dados."

        return {
            "response": response_message,
            "data": structured_response,
            "saved": saved_db
        }

    except Exception as e:
        print(f"Server Error in /chat: {e}")
        # Return a 500 but log the specific error
        raise HTTPException(status_code=500, detail="Internal Server Error processing request")

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
