def calculate_budget(travelers: int, days: int, category: str = "moderado") -> dict:
    rates = {
        "economico": {"hotel": 40, "food": 20, "transport": 60},
        "moderado":  {"hotel": 70, "food": 35, "transport": 80},
        "premium":   {"hotel": 150, "food": 70, "transport": 120},
    }
    r = rates.get(category, rates["moderado"])
    hotel = travelers * days * r["hotel"]
    food = travelers * days * r["food"]
    transport = travelers * r["transport"]
    extras = travelers * days * 10
    total = hotel + food + transport + extras
    return {
        "travelers": travelers,
        "days": days,
        "category": category,
        "breakdown": {
            "hospedaje": hotel,
            "alimentacion": food,
            "transporte": transport,
            "extras": extras,
        },
        "total_soles": total,
        "per_person": round(total / travelers, 2),
    }
