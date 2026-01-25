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

def save_expense(user_id: str, data: dict):
    if not supabase:
        return False
    try:
        response = supabase.table("expenses").insert({
            "user_id": user_id,
            "category": data.get("categoria"),
            "amount": data.get("valor"),
            "date": data.get("data"),
            "description": data.get("descricao", "") # Optional description
        }).execute()
        return True
    except Exception as e:
        print(f"Error saving expense: {e}")
        return False

def save_appointment(user_id: str, data: dict):
    if not supabase:
        return False
    try:
        response = supabase.table("appointments").insert({
            "user_id": user_id,
            "title": data.get("categoria"), # Using category as title for now
            "date": data.get("data"), # Timestamptz might need ISO format with time
            "description": data.get("descricao", "")
        }).execute()
        return True
    except Exception as e:
        print(f"Error saving appointment: {e}")
        return False

def get_expenses(user_id: str):
    if not supabase:
        return []
    try:
        response = supabase.table("expenses").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching expenses: {e}")
        return []

def get_appointments(user_id: str):
    if not supabase:
        return []
    try:
        response = supabase.table("appointments").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching appointments: {e}")
        return []
