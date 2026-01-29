import os
import json
from google import genai
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    print(f" [DEBUG KEY] Usando chave: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")
else:
    print(" [DEBUG KEY] Chave não encontrada.")

client = None
try:
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        print("Warning: GEMINI_API_KEY not found in environment variables.")
except Exception as e:
    print(f"Error initializing Gemini client: {e}")

def process_message(text: str, categories: list[str]) -> dict:
    """
    Processes the user text using Gemini API to extract structured data.
    """
    if not client:
        print("Gemini client is not initialized.")
        return {
            "type": "error",
            "description": "Client not initialized",
            "category": "Error"
        }

    current_time = datetime.now().isoformat()

    # Format categories for the prompt
    categories_str = ", ".join(categories) if categories else "Geral"

    prompt = f"""
    Atue como um assistente pessoal financeiro e de agenda para o Ordinis AI.
    Sua tarefa é analisar a mensagem do usuário e extrair dados estruturados em JSON.

    CATEGORIAS VÁLIDAS DO USUÁRIO:
    [{categories_str}]

    Se o usuário citar algo relacionado a estas categorias, classifique corretamente.

    REGRAS DE CLASSIFICAÇÃO:
    - Se a mensagem for sobre um pagamento, compra ou custo -> "expense"
    - Se a mensagem for sobre um compromisso, reunião, visita ou evento agendado -> "appointment"

    REGRA CRÍTICA DE DESEMPATE:
    - "Dentista dia 28" (ou médico/serviço com data futura e SEM valor explícito) -> "appointment"
    - "Paguei o dentista" (com ou sem valor) -> "expense"

    FORMATO DA RESPOSTA (JSON APENAS):

    - Expense: {{ "type": "expense", "category": "String (uma das válidas)", "amount": Float, "description": "String", "date": "ISO String (ou null para hoje)" }}
    - Appointment: {{ "type": "appointment", "title": "String", "date": "ISO String (Data e Hora futura)", "description": "String" }}

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
        raise e
