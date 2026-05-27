"""
RAG Agent.
Performs semantic search in pgvector via Supabase/Django.
"""
from dataclasses import asdict
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class RAGAgent(BaseAgent):
    def __init__(self, rag_engine, llm_client):
        self.rag_engine = rag_engine
        self.llm = llm_client

    def execute(self, state: OrchestratorState) -> OrchestratorState:
        if not state.intent:
            return state

        has_query_signal = any(
            getattr(state.intent, k, None)
            for k in ("destination", "departure_month", "budget_range", "interests", "group_type")
        )

        should_search = (
            has_query_signal or
            (state.intent.intent_type == "booking") or
            (state.intent.confidence_score >= 0.60 and state.intent.fields_detected >= 2)
        )

        if should_search and self.rag_engine:
            try:
                matches = self.rag_engine.search_matches(
                    state.intent, 
                    embed_fn=self.llm.embed, 
                    limit=3
                )
                
                # Serialize matches for state
                state.context_matches = [
                    asdict(m) if hasattr(m, "__dataclass_fields__") else m
                    for m in (matches or [])
                ]
            except Exception as e:
                print(f">>> [RAGAgent] Search failed: {e}")
                state.context_matches = []

        return state
