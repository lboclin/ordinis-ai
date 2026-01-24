import os
import gspread
from dotenv import load_dotenv

load_dotenv()

CREDENTIALS_FILE = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
SHEET_ID = os.getenv("SPREADSHEET_ID")

def save_entry(data: dict) -> bool:
    """
    Saves the structured data to the appropriate Google Sheet tab.
    data: { "tipo": "gasto/compromisso", "valor": float, "categoria": string, "data": string }
    """
    if not CREDENTIALS_FILE or not SHEET_ID:
        print("Google Sheets credentials or Spreadsheet ID not found.")
        return False

    try:
        gc = gspread.service_account(filename=CREDENTIALS_FILE)
        sh = gc.open_by_key(SHEET_ID)

        tipo = data.get("tipo", "").lower()

        if "gasto" in tipo:
            worksheet = sh.worksheet("Financeiro")
            # Assuming columns: Data, Categoria, Valor
            worksheet.append_row([data.get("data"), data.get("categoria"), data.get("valor")])
        elif "compromisso" in tipo:
            worksheet = sh.worksheet("Agenda")
            # Assuming columns: Data, Compromisso/Categoria
            worksheet.append_row([data.get("data"), data.get("categoria")])
        else:
            print(f"Unknown type: {tipo}")
            return False

        return True
    except Exception as e:
        print(f"Error saving to Sheets: {e}")
        return False
