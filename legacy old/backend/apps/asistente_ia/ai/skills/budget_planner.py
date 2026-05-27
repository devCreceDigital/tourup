"""
Skill: Budget Planner
Analyzes the user's budget against the trip prices.
"""
from typing import List, Dict, Any

def apply_budget_logic(matches: List[Dict[str, Any]], budget_range: str) -> List[Dict[str, Any]]:
    """
    Ajusta el 'match_score' de los viajes dependiendo de si se ajustan al presupuesto del usuario.
    """
    if not matches or not budget_range:
        return matches
        
    for match in matches:
        score = match.get("match_score", match.get("semantic_score", 0.0))
        price = match.get("price_from", 0)
        
        # Lógica simulada de presupuesto (En la BD real se cruza con el precio)
        # Asumiendo que 'premium' busca experiencias de alto valor, 'economico' busca ofertas.
        if budget_range == "premium":
            score += 0.2  # Le damos prioridad a los premium por defecto
        elif budget_range == "economico":
            score += 0.1
            
        match["match_score"] = min(1.0, max(0.0, score))
        
    # Re-sort
    matches.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return matches
