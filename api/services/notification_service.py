from services.db import supabase

def save_subscription(user_id, subscription_data):
    """
    Saves or updates a push subscription for a user.
    subscription_data matches the Web Push Subscription JSON format.
    """
    payload = {
        "user_id": user_id,
        "endpoint": subscription_data.get("endpoint"),
        "p256dh": subscription_data.get("keys", {}).get("p256dh"),
        "auth": subscription_data.get("keys", {}).get("auth")
    }
    # Using upsert to handle re-subscriptions or updates
    response = supabase.table("push_subscriptions").upsert(
        payload,
        on_conflict="user_id, endpoint"
    ).execute()
    return response.data

def get_notification_settings(user_id):
    """
    Retrieves notification settings for a user.
    """
    response = supabase.table("notification_settings").select("*").eq("user_id", user_id).execute()

    if response.data and len(response.data) > 0:
        return response.data[0]

    # Return defaults if not found (fallback)
    return {
        "user_id": user_id,
        "enabled": True,
        "reminder_time_minutes": 60,
        "day_before_alert_enabled": True,
        "day_before_alert_time": "20:00:00",
        "morning_threshold": "11:00:00"
    }

def update_notification_settings(user_id, settings_update):
    """
    Updates notification settings for a user.
    """
    # First check if exists, if not insert (lazy creation fallback)
    check = supabase.table("notification_settings").select("user_id").eq("user_id", user_id).execute()

    if not check.data:
        settings_update["user_id"] = user_id
        response = supabase.table("notification_settings").insert(settings_update).execute()
    else:
        response = supabase.table("notification_settings").update(settings_update).eq("user_id", user_id).execute()

    return response.data

def get_active_subscriptions(user_id):
    """
    Get all subscriptions for a user.
    """
    response = supabase.table("push_subscriptions").select("*").eq("user_id", user_id).execute()
    return response.data if response.data else []

def get_appointments_in_range(start_iso, end_iso, user_id=None):
    """
    Fetch appointments strictly between two ISO dates.
    Optional: Filter by user_id.
    """
    query = supabase.table("appointments")\
        .select("*")\
        .eq("is_cancelled", False)\
        .gte("date", start_iso)\
        .lte("date", end_iso)

    if user_id:
        query = query.eq("user_id", user_id)

    response = query.execute()
    return response.data if response.data else []
