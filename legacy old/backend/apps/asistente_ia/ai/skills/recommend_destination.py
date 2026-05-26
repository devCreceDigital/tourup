"""
Skill: Recommend Destination
Applies advanced scoring and ranking to match destinations with user intent.
"""
from typing import List, Dict, Any

def rank_destinations(matches: List[Dict[str, Any]], intent: Any) -> List[Dict[str, Any]]:
    """
    Toma los resultados del RAG y los re-ordena aplicando heurísticas de recomendación.
    """
    if not matches or not intent:
        return matches
        
    scored_matches = []
    for match in matches:
        score = match.get("semantic_score", 0.0)
        
        # Boost if the trip name explicitly contains the destination keyword
        if intent.destination and intent.destination.lower() in match.get("trip_name", "").lower():
            score += 0.15
            
        # Penalize slightly if seats are low but group is large
        available_seats = match.get("available_seats", 0)
        if intent.group_size and available_seats < intent.group_size:
            score -= 0.3 # Penalización fuerte si no caben
            
        match["match_score"] = min(1.0, max(0.0, score))
        scored_matches.append(match)
        
    # Sort by the final calculated score
    scored_matches.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_matches
