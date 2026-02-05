from datetime import datetime, timedelta
import calendar
import pytz

def generate_insights(user_id: str, supabase_client):
    """
    Gera insights financeiros baseados em projeção de gastos.
    Regras:
    1. Zona Segura: Dia < 5 -> Retorna vazio.
    2. Projeção: (Atual / Dia) * DiasMes
    3. Regra 1 (Explosão): Projetado > Anterior * 1.15 E Diff > 50
    4. Regra 2 (Economia): Projetado < Anterior * 0.85
    5. Regra 3 (Dominância): Categoria > 30% do Total Atual
    """

    # Setup Timezone
    tz = pytz.timezone('America/Sao_Paulo')
    now = datetime.now(tz)

    # 1. Zona Segura
    if now.day < 5:
        return []

    # Calculate Date Ranges
    # Current Month: 1st of current month to Now
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Previous Month: 1st of prev month to Last Day of prev month
    # To get last day of prev month: 1st of current month - 1 day
    last_day_prev_month = current_month_start - timedelta(days=1)
    prev_month_start = last_day_prev_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Fetch Data via Supabase Client (RLS)
    try:
        # Current Month Data
        current_res = supabase_client.table("expenses") \
            .select("amount, category") \
            .eq("user_id", user_id) \
            .eq("is_cancelled", False) \
            .gte("date", current_month_start.isoformat()) \
            .execute()
        current_expenses = current_res.data if current_res.data else []

        # Previous Month Data
        prev_res = supabase_client.table("expenses") \
            .select("amount, category") \
            .eq("user_id", user_id) \
            .eq("is_cancelled", False) \
            .gte("date", prev_month_start.isoformat()) \
            .lte("date", last_day_prev_month.replace(hour=23, minute=59, second=59).isoformat()) \
            .execute()
        prev_expenses = prev_res.data if prev_res.data else []

    except Exception as e:
        print(f"Error fetching data for insights: {e}")
        return []

    # Aggregate Data
    current_by_cat = {}
    total_current = 0.0

    for e in current_expenses:
        cat = e.get('category') or 'Outros'
        try:
            val = float(e.get('amount', 0))
        except:
            val = 0.0
        current_by_cat[cat] = current_by_cat.get(cat, 0.0) + val
        total_current += val

    prev_by_cat = {}
    for e in prev_expenses:
        cat = e.get('category') or 'Outros'
        try:
            val = float(e.get('amount', 0))
        except:
            val = 0.0
        prev_by_cat[cat] = prev_by_cat.get(cat, 0.0) + val

    insights = []
    days_in_current_month = calendar.monthrange(now.year, now.month)[1]

    # Avoid division by zero if day is 0 (impossible in datetime)
    current_day = now.day

    # Analyze Rules
    processed_categories = set(current_by_cat.keys()) | set(prev_by_cat.keys())

    for cat in processed_categories:
        current_val = current_by_cat.get(cat, 0.0)
        prev_val = prev_by_cat.get(cat, 0.0)

        # Projection Calculation
        # Gasto_Projetado = (Gasto_Atual_Categoria / Dia_Atual) * Dias_No_Mes
        if current_day > 0:
            projected = (current_val / current_day) * days_in_current_month
        else:
            projected = 0.0

        # Rule 1: Explosão de Gastos
        # Projected > Previous * 1.15 AND Diff > 50
        if prev_val > 0:
            if projected > (prev_val * 1.15) and (projected - prev_val > 50):
                pct_increase = ((projected - prev_val) / prev_val) * 100
                insights.append({
                    "type": "warning",
                    "category": cat,
                    "message": f"Atenção: Nesse ritmo, você gastará R$ {projected:.2f} em {cat}, {int(pct_increase)}% a mais que mês passado.",
                    "value": projected
                })

        # Rule 2: Economia Real
        # Projected < Previous * 0.85
        if prev_val > 0:
            if projected < (prev_val * 0.85):
                saved = prev_val - projected
                insights.append({
                    "type": "success",
                    "category": cat,
                    "message": f"Parabéns! Você está economizando em {cat}. Previsão de fechar o mês com R$ {saved:.2f} a menos.",
                    "value": saved
                })

        # Rule 3: Dominância
        # Current Cat Spend > Total Spend * 0.30
        # Only if we have significant spend (e.g., > 0)
        if total_current > 0 and current_val > 0:
            if current_val > (total_current * 0.30):
                # Avoid duplicate if already caught by explosion?
                # The prompt doesn't say to exclusive rules. I'll include it.
                # However, ensure we don't spam. But prompt requirements are specific.
                pct_total = int((current_val / total_current) * 100)

                # Check if we already added a warning for this category to avoid clutter?
                # Prompt doesn't specify. I'll add it.
                insights.append({
                    "type": "warning",
                    "category": cat,
                    "message": f"{cat} está consumindo {pct_total}% do seu orçamento este mês.",
                    "value": current_val
                })

    return insights
