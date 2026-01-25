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
    Returns a dictionary with keys: tipo, valor, categoria, descricao, data_hora.
    """
    if not client:
        print("Gemini client is not initialized.")
        return {
            "tipo": "despesa",
            "valor": 0.0,
            "categoria": "Indefinido (Client not initialized)",
            "descricao": "Mock data - Check API Key",
            "data_hora": datetime.now().isoformat()
        }

    current_time = datetime.now().isoformat()

    prompt = f"""
    Atue como um assistente pessoal financeiro e de agenda.
    Analise a seguinte mensagem do usuário e extraia as informações em formato JSON.
    A mensagem pode ser um registro de despesa ou um compromisso na agenda.

    Instruções:
    1. Se for despesa, extraia valor, descrição e categoria.
    2. Categorias básicas sugeridas: 'Alimentação', 'Transporte', 'Supermercado', 'Restaurante', 'Combustível', 'Saúde', 'Lazer'.
    3. Se o gasto não se encaixar nas básicas, você DEVE CRIAR uma categoria nova que seja descritiva e curta (ex: 'Farmácia', 'Educação', 'Pets', 'Manutenção').
    4. Se for compromisso, extraia título (como descrição) e data/hora.
    5. 'data_hora' deve ser uma string ISO 8601 completa (ex: '2023-10-27T14:30:00'). Se o ano não for especificado, assuma o ano atual. Hoje é {current_time}.

    Formato de saída desejado (JSON):
    {{
        "tipo": "despesa" | "compromisso",
        "descricao": string,
        "valor": float (apenas se despesa, senão null),
        "categoria": string (apenas se despesa, senão null),
        "data_hora": string (ISO format)
    }}

    Mensagem: "{text}"
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        # Clean up code blocks if Gemini returns markdown
        content = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        return data
    except Exception as e:
        print(f"Error processing with Gemini: {e}")
        return {
            "tipo": "erro",
            "descricao": "Erro de processamento",
            "data_hora": current_time
        }
