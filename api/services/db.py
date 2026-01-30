import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = None

if url and key:
    supabase = create_client(url, key)

def get_user_from_token(token: str):
    if not supabase:
        return None
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        print(f"Error validating token: {e}")
        return None

def save_expense(user_id: str, payload: dict):
    """
    payload is the 'data' part of the JSON: { description, amount, category, date, ... }
    """
    if not supabase:
        return False
    try:
        db_payload = {
            "user_id": user_id,
            "category": payload.get("category"),
            "amount": payload.get("amount"),
            "date": payload.get("date"),
            "description": payload.get("description", "")
        }

        response = supabase.table("expenses").insert(db_payload).execute()
        return True
    except Exception as e:
        print(f"Error saving expense: {e}")
        return False

def save_appointment(user_id: str, payload: dict):
    """
    payload is the 'data' part of the JSON: { description, date, time, ... }
    """
    if not supabase:
        return False
    try:
        # Construct timestamp if time is available
        date_str = payload.get("date")
        time_str = payload.get("time")
        final_date = date_str

        if date_str and time_str:
            final_date = f"{date_str}T{time_str}:00"
        elif date_str:
            final_date = f"{date_str}T00:00:00"

        db_payload = {
            "user_id": user_id,
            "title": payload.get("description"),
            "date": final_date,
            "description": "" # Optional extra details
        }

        response = supabase.table("appointments").insert(db_payload).execute()
        return True
    except Exception as e:
        print(f"Error saving appointment: {e}")
        return False

def get_expenses(user_id: str):
    if not supabase:
        return []
    try:
        response = supabase.table("expenses").select("*").eq("user_id", user_id).eq("is_cancelled", False).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching expenses: {e}")
        return []

def get_appointments(user_id: str):
    if not supabase:
        return []
    try:
        response = supabase.table("appointments").select("*").eq("user_id", user_id).eq("is_cancelled", False).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching appointments: {e}")
        return []
