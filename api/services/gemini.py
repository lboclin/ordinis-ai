import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def process_message(text: str) -> dict:
    """
    Processes the user text using Gemini API to extract structured data.
    Returns a dictionary with keys: tipo, valor, categoria, data.
    """
    if not GEMINI_API_KEY:
        # Mock response if no API key is present
        return {
            "tipo": "gasto",
            "valor": 0.0,
            "categoria": "Indefinido (API Key missing)",
            "data": "2023-01-01"
        }

    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = f"""
    Analise a seguinte mensagem do usuário e extraia as informações em formato JSON.
    A mensagem pode ser um registro de gasto ou um compromisso na agenda.

    Formato de saída desejado (JSON):
    {{
        "tipo": "gasto" ou "compromisso",
        "valor": float (se for gasto, senão 0),
        "categoria": string (ex: "Supermercado", "Roupa", "Reunião", "Médico"),
        "data": string (formato YYYY-MM-DD, hoje é {os.getenv('TODAY_DATE', 'uma data recente')})
    }}

    Mensagem: "{text}"
    """

    try:
        response = model.generate_content(prompt)
        # Clean up code blocks if Gemini returns markdown
        content = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        return data
    except Exception as e:
        print(f"Error processing with Gemini: {e}")
        return {
            "tipo": "erro",
            "valor": 0.0,
            "categoria": "Erro de processamento",
            "data": ""
        }
