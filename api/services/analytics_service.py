from datetime import datetime, timedelta
import calendar
import pytz

def generate_insights(user_id: str, supabase_client):
    """
    Gera insights financeiros baseados em projeção de gastos.
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
    total_prev = 0.0
    for e in prev_expenses:
        cat = e.get('category') or 'Outros'
        try:
            val = float(e.get('amount', 0))
        except:
            val = 0.0
        prev_by_cat[cat] = prev_by_cat.get(cat, 0.0) + val
        total_prev += val

    insights = []
    days_in_current_month = calendar.monthrange(now.year, now.month)[1]
    current_day = now.day if now.day > 0 else 1 # Safety check

    # Modo "Primeiro Mês" (Sem histórico)
    if total_prev == 0:
        # Regra de Concentração (> 40%)
        if total_current > 0:
            for cat, val in current_by_cat.items():
                if val > (total_current * 0.40):
                     pct = int((val / total_current) * 100)
                     insights.append({
                        "type": "warning",
                        "category": cat,
                        "message": f"Atenção: {cat} representa {pct}% de tudo que você gastou até agora.",
                        "value": val
                    })

        # Regra de Custo Único (Não temos 'hoje' específico aqui fácil sem filtrar de novo,
        # mas podemos assumir gastos altos > 200 como alerta para novos users?)
        # O prompt diz: "Você teve um gasto alto de R$ X em [Categoria] hoje."
        # Vamos ver se tem algum gasto hoje > R$ 300 (arbitrário ou baseado em média?)
        # Simplificação: Se tiver um gasto > 30% do total acumulado num unico registro HOJE.

        # Filtrar gastos de hoje
        today_str = now.strftime('%Y-%m-%d')
        todays_expenses = [e for e in current_expenses if e.get('date', '').startswith(today_str)]

        for e in todays_expenses:
             try:
                val = float(e.get('amount', 0))
                cat = e.get('category', 'Outros')
                if val > 100 and (total_current > 0 and val > total_current * 0.3):
                    insights.append({
                        "type": "warning",
                        "category": cat,
                        "message": f"Você teve um gasto alto de R$ {val:.2f} em {cat} hoje.",
                        "value": val
                    })
             except:
                 pass

        if not insights:
             insights.append({
                "type": "info", # Frontend might render as success or neutral
                "category": "Geral",
                "message": "Seus insights ficarão mais precisos no próximo mês, quando tivermos histórico para comparar.",
                "value": 0
            })

        return insights

    # Modo Normal (Com Histórico)
    processed_categories = set(current_by_cat.keys()) | set(prev_by_cat.keys())

    for cat in processed_categories:
        current_val = current_by_cat.get(cat, 0.0)
        prev_val = prev_by_cat.get(cat, 0.0)

        # Projection Calculation
        projected = (current_val / current_day) * days_in_current_month

        # Rule 1: Explosão de Gastos
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
        if total_current > 0 and current_val > 0:
            if current_val > (total_current * 0.30):
                pct_total = int((current_val / total_current) * 100)
                # Avoid duplicate logic if already added?
                # Check strict prompt requirement: "Se Gasto_Categoria_Atual > Total_Gasto_Atual * 0.30"
                # We add it.
                insights.append({
                    "type": "warning",
                    "category": cat,
                    "message": f"{cat} está consumindo {pct_total}% do seu orçamento este mês.",
                    "value": current_val
                })

    return insights
