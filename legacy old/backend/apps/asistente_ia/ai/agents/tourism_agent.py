"""
Tourism Agent.
Recommends trips by orchestrating specialized skills (recommendation & budgeting).
"""
from dataclasses import asdict
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

# Importamos las Skills
from apps.asistente_ia.ai.skills.recommend_destination import rank_destinations
from apps.asistente_ia.ai.skills.budget_planner import apply_budget_logic

class TourismAgent(BaseAgent):
    def execute(self, state: OrchestratorState) -> OrchestratorState:
        if not state.intent or state.intent.intent_type != "booking":
            return state
            
        print(">>> [TourismAgent] Analyzing travel options using Skills...")
        
        # If RAG Agent already found matches, we score them using our Skills
        if state.context_matches:
            # 1. Skill de recomendación general (evalúa cupos y nombre del destino)
            state.context_matches = rank_destinations(state.context_matches, state.intent)
            
            # 2. Skill de presupuesto (evalúa el dinero)
            if state.intent.budget_range:
                state.context_matches = apply_budget_logic(state.context_matches, state.intent.budget_range)
                
        return state
