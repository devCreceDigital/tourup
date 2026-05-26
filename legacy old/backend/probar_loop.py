import os
import sys
from dotenv import load_dotenv

# Configurar entorno Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('.env')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'totem_backend.settings')
import django
django.setup()

from apps.asistente_ia.ai.orchestrator.hermes_agent import Hermes
from apps.asistente_ia.ai.parsers.response_parser import intent_engine
from apps.asistente_ia.ai.rag.retriever import rag_engine
from apps.asistente_ia.ai.memory.session_memory import conversation_manager
from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client
import uuid

def test_conversation():
    print("="*50)
    print("🚀 INICIANDO PRUEBA DE CONVERSACIÓN GENERAL")
    print("="*50)
    
    hermes = Hermes(intent_engine, rag_engine, conversation_manager, openrouter_client)
    session_token = str(uuid.uuid4())
    
    # 1. El usuario saluda
    msg = "Hola"
    print(f"\n👤 USUARIO: {msg}")
    conversation_manager.add_message(session_token, "user", msg)
    res = hermes.run(session_token, msg, "es")
    print(f"🤖 ASISTENTE: {res['response']}")
    conversation_manager.add_message(session_token, "assistant", res['response'])

    # 2. El usuario dice algo vago
    msg = "no se a donde ir"
    print(f"\n👤 USUARIO: {msg}")
    conversation_manager.add_message(session_token, "user", msg)
    res = hermes.run(session_token, msg, "es")
    print(f"🤖 ASISTENTE: {res['response']}")
    conversation_manager.add_message(session_token, "assistant", res['response'])
    
    # 3. El usuario dice sorprendeme
    msg = "sorprendeme"
    print(f"\n👤 USUARIO: {msg}")
    conversation_manager.add_message(session_token, "user", msg)
    res = hermes.run(session_token, msg, "es")
    print(f"🤖 ASISTENTE: {res['response']}")
    conversation_manager.add_message(session_token, "assistant", res['response'])

if __name__ == "__main__":
    test_conversation()
