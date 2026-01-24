from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from services.gemini import process_message
from services.sheets import save_entry
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Ordinis AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """
    Receives a user message, processes it with Gemini, and saves to Sheets.
    """
    try:
        # 1. Process with Gemini
        structured_data = process_message(request.message)

        # 2. Save to Sheets (only if valid type)
        saved = False
        if structured_data.get("tipo") in ["gasto", "compromisso"]:
            saved = save_entry(structured_data)

        response_message = ""
        if structured_data.get("tipo") == "erro":
             response_message = "Desculpe, tive um problema ao processar sua mensagem."
        elif saved:
            response_message = f"Entendido! Registrei um {structured_data['tipo']} de '{structured_data['categoria']}' no valor de {structured_data['valor']} para o dia {structured_data['data']}."
        else:
             response_message = f"Processei como {structured_data['tipo']}, mas não consegui salvar na planilha (verifique credenciais)."

        return {
            "response": response_message,
            "data": structured_data,
            "saved": saved
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
