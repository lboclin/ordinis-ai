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

    REGRAS DE CATEGORIZAÇÃO (Mapeamento Inteligente):
    - Gasolina, Uber, Ônibus, Metrô -> "Transporte"
    - Remédio, Farmácia, Médico, Dentista -> "Saúde"
    - Restaurante, Supermercado, Lanche, Bar, Ifood -> "Alimentação"
    - Academia, Boxe, Suplementos, Natação -> "Bem-estar/Esporte"
    - Aluguel, Luz, Água, Internet, Condomínio -> "Moradia"
    - Se não encaixar em nenhuma, use "Outros" ou crie uma categoria curta e descritiva (1 palavra).

    FORMATO DA RESPOSTA (JSON APENAS):
    {{
      "type": "expense" | "appointment",
      "data": {{
        "description": string (descrição clara do item ou título do compromisso),
        "amount": float (apenas se for expense, senão null),
        "category": string (use o mapeamento inteligente acima),
        "date": "YYYY-MM-DD" (se o ano não for informado, use o atual: {datetime.now().year}),
        "time": "HH:mm" (se disponível, senão null),
        "tags": [string] (palavras-chave relevantes)
      }}
    }}

    Hoje é: {current_time}

    Mensagem do usuário: "{text}"
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        content = response.text
        # Ensure it's clean JSON
        content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        return data
    except Exception as e:
        print(f"Error processing with Gemini: {e}")
        return {
            "type": "error",
            "data": {
                "description": "Erro de processamento",
            }
        }
