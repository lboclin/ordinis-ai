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
    Receives a user message, processes it with Gemini, and saves to DB.
    """
    try:
        # 1. Process with Gemini
        structured_data = process_message(request.message)

        # 2. Save to DB
        saved_db = False

        if structured_data.get("tipo") == "despesa":
            saved_db = save_expense(user.id, structured_data)
        elif structured_data.get("tipo") == "compromisso":
            saved_db = save_appointment(user.id, structured_data)

        # 3. Construct Friendly Response
        response_message = ""
        if structured_data.get("tipo") == "erro":
             response_message = "Desculpe, não consegui entender o que você disse. Poderia reformular?"
        elif saved_db:
            if structured_data.get("tipo") == "despesa":
                # "Gasto de R$ 30 em restaurante anotado com sucesso!"
                val = f"{structured_data.get('valor', 0):.2f}".replace('.', ',')
                cat = structured_data.get('categoria', 'geral')
                response_message = f"Gasto de R$ {val} em {cat} anotado com sucesso!"
            else:
                 # Compromisso
                 date_str = structured_data.get('data_hora', '')
                 try:
                     dt = datetime.fromisoformat(date_str)
                     fmt_date = dt.strftime("%d/%m às %H:%M")
                 except:
                     fmt_date = date_str

                 desc = structured_data.get('descricao', 'Compromisso')
                 response_message = f"Agendado: {desc} para {fmt_date}."
        else:
             response_message = f"Entendi que é um {structured_data.get('tipo')}, mas tive um erro ao salvar no banco de dados."

        return {
            "response": response_message,
            "data": structured_data,
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
