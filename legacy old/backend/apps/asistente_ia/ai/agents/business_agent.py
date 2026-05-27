"""
Business Rules Agent.
Applies domain-specific logic for travels and leads.
"""
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class BusinessRulesAgent(BaseAgent):
    def execute(self, state: OrchestratorState) -> OrchestratorState:
        # Here we apply business rules.
        # Example: if user wants a 'premium' trip, filter out low-rating agencies.
        # Example: Check if the user is ready to become a lead.
        
        state.business_context = {
            "can_create_lead": False,
            "requires_human_handoff": False
        }
        
        if state.intent and state.intent.intent_type == "lead_intent":
            state.business_context["can_create_lead"] = True
            
        # In a more advanced version, this agent could filter `state.context_matches`
        # based on inventory, strict business policies, etc.
            
        return state
