"""
State module for Hermes Multi-Agent Orchestrator.
Defines the shared state object passed between agents (Graph State).
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class OrchestratorState:
    session_token: str
    user_message: str
    language: str
    
    # Intent Agent
    intent: Optional[Any] = None
    
    # Memory Agent
    chat_history: List[Dict[str, str]] = field(default_factory=list)
    session_summary: str = ""
    long_term_memory: List[Dict[str, Any]] = field(default_factory=list)
    
    # RAG Agent
    context_matches: List[Dict[str, Any]] = field(default_factory=list)
    
    # Accumulated intent from previous turns (for multi-turn memory)
    accumulated_intent: Dict[str, Any] = field(default_factory=dict)

    # Business Rules Agent
    business_context: Dict[str, Any] = field(default_factory=dict)
    
    # Planner Agent & Tool Calling
    execution_plan: List[str] = field(default_factory=list)
    system_prompt: str = ""
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    tool_results: List[Dict[str, Any]] = field(default_factory=list)
    
    # Generator Agent
    raw_response: str = ""
    
    # Validator Agent
    final_response: str = ""
    is_valid: bool = True
    error_message: str = ""
    
    # Observability & Metrics
    metrics: Dict[str, float] = field(default_factory=dict)
    
    def record_metric(self, node_name: str, duration: float):
        self.metrics[node_name] = duration

    def extracted_destination(self) -> Optional[str]:
        """Retorna el destino detectado por el IntentAgent, si existe."""
        if self.intent and hasattr(self.intent, "destination"):
            return self.intent.destination
        if isinstance(self.intent, dict):
            return self.intent.get("destination")
        return None
