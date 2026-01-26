import os
import json
from google import genai
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
try:
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        print("Warning: GEMINI_API_KEY not found in environment variables.")
except Exception as e:
    print(f"Error initializing Gemini client: {e}")

def process_message(text: str) -> dict:
    """
    Processes the user text using Gemini API to extract structured data.
    """
    if not client:
        print("Gemini client is not initialized.")
        return {
            "type": "error",
            "data": {
                "description": "Client not initialized",
                "category": "Error"
            }
        }

    current_time = datetime.now().isoformat()

    prompt = f"""
    Atue como um assistente pessoal financeiro e de agenda para o Ordinis AI.
    Sua tarefa é analisar a mensagem do usuário e extrair dados estruturados em JSON.

    REGRAS DE CLASSIFICAÇÃO:
    - Se a mensagem for sobre um pagamento, compra ou custo -> "expense"
    - Se a mensagem for sobre um compromisso, reunião, visita ou evento agendado -> "appointment"

    REGRA CRÍTICA DE DESEMPATE:
    - "Dentista dia 28" (ou médico/serviço com data futura e SEM valor explícito) -> "appointment"
    - "Paguei o dentista" (com ou sem valor) -> "expense"

    FORMATO DA RESPOSTA (JSON APENAS):

    1. Para DESPESAS (expense):
    {{
      "type": "expense",
      "data": {{
        "category": "Transporte" | "Alimentação" | "Saúde" | "Lazer" | "Casa" | "Outros",
        "amount": float,
        "description": string,
        "date": "YYYY-MM-DD" (se ano não informado, use {datetime.now().year}),
        "tags": [string]
      }}
    }}

    2. Para COMPROMISSOS (appointment):
    {{
      "type": "appointment",
      "data": {{
        "title": string,
        "date": "YYYY-MM-DDTHH:MM:SS" (Se hora não informada, assuma 09:00:00),
        "description": string
      }}
    }}

    Hoje é: {current_time}

    Mensagem do usuário: "{text}"
    """

    try:
        # Usa o modelo flash 2.0 para maior estabilidade de cota
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        content = response.text
        # Limpeza preventiva de markdown
        content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        return data

    except Exception as e:
        error_str = str(e)
        print(f"Error processing with Gemini: {error_str}")
        
        # Tratamento específico para Cota Excedida (429 / ResourceExhausted)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            return {
                "type": "expense",  # Classifica como despesa para exibir o card de erro
                "data": {
                    "category": "Erro de Cota",
                    "amount": 0.0,
                    "description": "A IA está sobrecarregada, tente em 1 min",
                    "date": None,
                    "tags": ["erro", "sistema"]
                }
            }
            
        # Fallback genérico
        return {
            "type": "error",
            "data": {
                "description": "Erro interno de processamento",
            }
        }
