import os
import json
import logging
from datetime import datetime, timedelta
import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from services.notification_service import (
    get_appointments_in_range,
    get_notification_settings,
    get_active_subscriptions
)
from services.db import supabase
from pywebpush import webpush, WebPushException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()
TZ = pytz.timezone('America/Sao_Paulo')

def send_push(subscription, message, data=None):
    vapid_private = os.environ.get("VAPID_PRIVATE_KEY")
    vapid_email = os.environ.get("VAPID_MAILTO")

    if not vapid_private or not vapid_email:
        logger.warning("Missing VAPID keys")
        return

    try:
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {
                    "p256dh": subscription["p256dh"],
                    "auth": subscription["auth"]
                }
            },
            data=json.dumps({"title": "Ordinis", "body": message, "data": data}),
            vapid_private_key=vapid_private,
            vapid_claims={"sub": vapid_email}
        )
        logger.info(f"🚀 ENVIANDO PUSH para endpoint {subscription['endpoint'][:20]}...")
    except WebPushException as ex:
        logger.error(f"❌ Erro ao enviar: {ex}")
        if ex.response and ex.response.status_code == 410:
             # Subscription expired/gone. In a real app, delete from DB.
             pass

def check_reminders():
    try:
        now = datetime.now(TZ)
        # Reduce spammy logs, only log if significant activity or periodically
        # logger.info(f"Checking reminders at {now}")

        # --- 1. STANDARD REMINDERS ---
        # Look ahead 2 hours + buffer
        limit = now + timedelta(hours=2, minutes=5)
        appointments = get_appointments_in_range(now.isoformat(), limit.isoformat())

        if appointments:
             logger.info(f"[SCHEDULER] Encontrados {len(appointments)} compromissos na janela de busca.")

        user_settings_cache = {}

        for appt in appointments:
            uid = appt['user_id']
            if uid not in user_settings_cache:
                user_settings_cache[uid] = get_notification_settings(uid)

            settings = user_settings_cache[uid]
            if not settings.get('enabled', True):
                continue

            reminder_minutes = settings.get('reminder_time_minutes', 60)

            # Parse Appointment Date
            try:
                appt_dt = datetime.fromisoformat(appt['date'])
            except ValueError:
                continue

            if appt_dt.tzinfo is None:
                # Assume appt dates are stored in same TZ or UTC.
                appt_dt = appt_dt.replace(tzinfo=pytz.utc).astimezone(TZ) if appt_dt.tzinfo else TZ.localize(appt_dt)
            else:
                 appt_dt = appt_dt.astimezone(TZ)

            # Trigger time
            trigger_time = appt_dt - timedelta(minutes=reminder_minutes)

            # Check if we are within the "current minute" of the trigger
            diff = (trigger_time - now).total_seconds()

            # Debug log for analysis
            logger.info(f"[SCHEDULER] Analisando: {appt.get('title')} - Diff Segundos: {diff:.2f} - ConfigUsuario: {reminder_minutes} min")

            # Wider window: -30s to +30s (approx 1 min window) to catch it reliably
            # Since scheduler runs every 60s, a 60s window covers everything without gaps.
            # abs(diff) < 35 might have been too tight if jitter > 5s? No, 35 is actually > 30.
            # Let's align with the requested logic: "window"
            # If we run every 60s, the check times are T, T+60, T+120.
            # An event at T+30 should be caught.
            # Previous logic: abs(diff) < 29.
            # If diff is 31 (trigger is 31s ahead), it fails. Next run diff is -29. Fails (borderline).
            # Better: if -2 <= diff <= 62 (catching slightly past and up to next minute)
            # Or just abs(diff) < 32 to be safe.

            if -5 <= diff <= 65: # Asepting slight delays or slightly early checks
                logger.info(f"[SCHEDULER] 🔔 Triggering reminder for {appt.get('title')}")
                subs = get_active_subscriptions(uid)
                if not subs:
                    logger.warning(f"[SCHEDULER] ⚠️ Nenhum subscription ativo para User {uid}")

                msg = f"Lembrete: {appt.get('title', 'Compromisso')} em {reminder_minutes} min."
                for sub in subs:
                    send_push(sub, msg, {"url": "/agenda"})

        # --- 2. DAY BEFORE ALERTS ---
        # ... logic remains similar ...
        response = supabase.table("notification_settings")\
            .select("*")\
            .eq("day_before_alert_enabled", True)\
            .execute()

        all_enabled_settings = response.data if response.data else []

        for settings in all_enabled_settings:
            # Parse user's alert time
            alert_time_str = settings.get('day_before_alert_time', '20:00:00')
            try:
                # format HH:MM:SS or HH:MM
                t_parts = [int(x) for x in alert_time_str.split(':')]
                alert_h, alert_m = t_parts[0], t_parts[1]

                # Check if NOW matches Alert Time (roughly)
                if now.hour == alert_h and now.minute == alert_m:
                    logger.info(f"[SCHEDULER] 🌅 Verificando 'Day Before' para User {settings['user_id']}")

                    # Proceed to check tomorrow's appointments
                    uid = settings['user_id']
                    morning_threshold_str = settings.get('morning_threshold', '11:00:00')

                    # Tomorrow
                    tomorrow = now.date() + timedelta(days=1)

                    # Start of tomorrow
                    start_tomorrow = TZ.localize(datetime.combine(tomorrow, datetime.min.time()))

                    # Threshold
                    mt_parts = [int(x) for x in morning_threshold_str.split(':')]
                    end_tomorrow = TZ.localize(datetime.combine(tomorrow, datetime.min.time().replace(hour=mt_parts[0], minute=mt_parts[1])))

                    # Query appointments with USER_ID filtering
                    user_appts = get_appointments_in_range(start_tomorrow.isoformat(), end_tomorrow.isoformat(), user_id=uid)

                    if user_appts:
                        count = len(user_appts)
                        first = user_appts[0]['title']
                        msg = f"Agenda de amanhã: {first}" + (f" e mais {count-1}." if count > 1 else ".")
                        logger.info(f"[SCHEDULER] 🚀 ENVIANDO PUSH Day Before para User {uid}")

                        subs = get_active_subscriptions(uid)
                        for sub in subs:
                            send_push(sub, msg, {"url": "/agenda"})

            except Exception as e:
                logger.error(f"Error processing rule 2 for user {settings.get('user_id')}: {e}")
                continue

    except Exception as e:
        logger.error(f"Scheduler Loop Error: {e}")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_reminders, 'interval', minutes=1)
        scheduler.start()
        logger.info("Scheduler started.")
