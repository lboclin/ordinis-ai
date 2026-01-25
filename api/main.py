from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from services.gemini import process_message
from services.sheets import save_entry as save_to_sheets
from services.db import get_user_from_token, save_expense, save_appointment, get_expenses, get_appointments
import os
from dotenv import load_dotenv

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
def chat_endpoint(request: ChatRequest, user = Depends(get_current_user)):
    """
    Receives a user message, processes it with Gemini, and saves to DB (and Sheets).
    """
    try:
        # 1. Process with Gemini
        structured_data = process_message(request.message)

        # 2. Save to DB and Sheets
        saved_db = False
        saved_sheets = False

        if structured_data.get("tipo") == "gasto":
            saved_db = save_expense(user.id, structured_data)
            saved_sheets = save_to_sheets(structured_data) # Legacy/Backup
        elif structured_data.get("tipo") == "compromisso":
            saved_db = save_appointment(user.id, structured_data)
            saved_sheets = save_to_sheets(structured_data) # Legacy/Backup

        response_message = ""
        if structured_data.get("tipo") == "erro":
             response_message = "Desculpe, tive um problema ao processar sua mensagem."
        elif saved_db:
            response_message = f"Entendido! Registrei um {structured_data['tipo']} de '{structured_data['categoria']}' no valor de {structured_data['valor']} para o dia {structured_data['data']}."
        else:
             response_message = f"Processei como {structured_data['tipo']}, mas houve um erro ao salvar."

        return {
            "response": response_message,
            "data": structured_data,
            "saved": saved_db
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard")
def get_dashboard_data(user = Depends(get_current_user)):
    expenses = get_expenses(user.id)
    # Process data for charts if needed, or return raw
    return expenses

@app.get("/agenda")
def get_agenda_data(user = Depends(get_current_user)):
    appointments = get_appointments(user.id)
    return appointments
