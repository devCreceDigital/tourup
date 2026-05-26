"""
Memory Agent.
Retrieves conversation history and summaries.
"""
from apps.asistente_ia.ai.agents.base import BaseAgent
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class MemoryAgent(BaseAgent):
    def __init__(self, conversation_manager):
        self.conversation_manager = conversation_manager

    def execute(self, state: OrchestratorState) -> OrchestratorState:
        # Get raw messages
        messages = self.conversation_manager.get_messages(state.session_token)
        
        # Sanitize messages for LLM (remove 'ts' or other internal fields)
        sanitized_messages = [{"role": m["role"], "content": m["content"]} for m in messages]
        
        # Short-term memory: Keep only the last 10 messages
        state.chat_history = sanitized_messages[-10:] if sanitized_messages else []
        
        # Session Summary generation logic (Mock for now, would use an async task in prod)
        if len(sanitized_messages) > 10 and len(sanitized_messages) % 5 == 0:
            state.session_summary = f"Conversación activa sobre viajes. Mensajes totales: {len(sanitized_messages)}"
        
        # Long-term memory (vectorial) simulation
        # Here we would query pgvector for past sessions from this user
        state.long_term_memory = []
        
        return state
