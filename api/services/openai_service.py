import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY:
    print(f" [DEBUG KEY] Usando chave OpenAI: {OPENAI_API_KEY[:5]}...{OPENAI_API_KEY[-5:]}")
else:
    print(" [DEBUG KEY] Chave OpenAI não encontrada.")

client = None
try:
    if OPENAI_API_KEY:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    else:
        print("Warning: OPENAI_API_KEY not found in environment variables.")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")

async def process_message(text: str, categories: list[str]) -> dict:
    """
    Processes the user text using OpenAI API to extract structured data.
    """
    if not client:
        print("OpenAI client is not initialized.")
        return {
            "type": "error",
            "description": "Client not initialized",
            "category": "Error"
        }

    current_time = datetime.now().isoformat()

    # Format categories for the prompt
    categories_str = ", ".join(categories) if categories else "Geral"

    system_prompt = f"""
    Atue como um assistente pessoal financeiro e de agenda para o Ordinis AI.
    Sua tarefa é analisar a mensagem do usuário e extrair dados estruturados em JSON.

    CATEGORIAS VÁLIDAS DO USUÁRIO:
    [{categories_str}]

    Se o usuário citar algo relacionado a estas categorias, classifique corretamente.

    REGRAS DE CLASSIFICAÇÃO:
    - Se a mensagem for sobre um pagamento, compra ou custo -> "expense"
    - Se a mensagem for sobre um compromisso, reunião, visita ou evento agendado -> "appointment"
    - Se o usuário pedir para cancelar a ação anterior (ex: "cancelar", "desfazer", "apagar último") -> "cancellation"

    REGRA CRÍTICA DE DESEMPATE:
    - "Dentista dia 28" (ou médico/serviço com data futura e SEM valor explícito) -> "appointment"
    - "Paguei o dentista" (com ou sem valor) -> "expense"

    REGRA DE FLEXIBILIDADE DE HORÁRIO:
    - Seja MUITO flexível com horários. Aceite termos como "de noite", "manhã", "à tarde", "logo mais", "22h", "10h".
    - Se o usuário der qualquer indicativo de tempo (mesmo vago), ACEITE e processe o agendamento.
    - Se ele disser "dia 7", assuma que é o próximo dia 7.
    - APENAS pergunte novamente se NÃO HOUVER NENHUMA menção a tempo na frase.

    FORMATO DA RESPOSTA (JSON APENAS):

    - Expense: {{ "type": "expense", "category": "String (uma das válidas)", "amount": Float, "description": "String", "date": "ISO String (ou null para hoje)" }}
    - Appointment: {{ "type": "appointment", "title": "String", "date": "ISO String (Data e Hora futura)", "description": "String" }}
    - Cancellation: {{ "type": "cancellation" }}
    - Response: {{ "type": "response", "message": "String (pergunta de esclarecimento)" }}

    Hoje é: {current_time}
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            response_format={ "type": "json_object" }
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        # Ensure date is never null
        if not data.get("date"):
            data["date"] = datetime.now().isoformat()

        return data

    except Exception as e:
        error_str = str(e)
        print(f"Error processing with OpenAI: {error_str}")
        raise e

async def transcribe_audio(file) -> str:
    """
    Transcribes audio file using OpenAI Whisper model.
    """
    if not client:
        raise Exception("OpenAI client not initialized")

    try:
        # Create a transcription
        transcription = await client.audio.transcriptions.create(
            model="whisper-1",
            file=file,
            response_format="text"
        )
        return transcription
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        raise e
