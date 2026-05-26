"""
Base Agent Interface.
"""
from abc import ABC, abstractmethod
from apps.asistente_ia.ai.orchestrator.state_manager import OrchestratorState

class BaseAgent(ABC):
    @abstractmethod
    def execute(self, state: OrchestratorState) -> OrchestratorState:
        """
        Executes the agent's specific logic, modifying and returning the state.
        """
        pass
