"""
Lead Agent.
Detects purchase intent and creates leads automatically.
Assigns a lead score.
"""
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class LeadAgent(BaseAgent):
    def execute(self, state: OrchestratorState) -> OrchestratorState:
        if not state.intent:
            return state
            
        print(">>> [LeadAgent] Analyzing lead potential...")
        
        is_commercial = state.intent.intent_type in ["lead", "booking"]
        has_high_confidence = state.intent.confidence_score > 0.8
        
        if is_commercial and has_high_confidence:
            # Calculate Lead Score (0-100)
            score = 50
            if state.intent.budget_range == "premium": score += 20
            if state.intent.group_size and state.intent.group_size >= 4: score += 20
            if state.intent.departure_month: score += 10
            
            state.business_context["lead_score"] = min(100, score)
            state.business_context["is_hot_lead"] = score >= 80
            
            # If it's a hot lead, request a tool call to create it in the CRM
            if state.business_context["is_hot_lead"]:
                state.tool_calls.append({
                    "name": "crear_lead",
                    "parameters": {
                        "score": score,
                        "intent_data": state.intent.__dict__
                    }
                })
                print(f">>> [LeadAgent] Hot Lead Detected (Score: {score}). Queuing CRM Tool.")
                
        return state
