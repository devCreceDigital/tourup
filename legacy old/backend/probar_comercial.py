import os
import sys
import uuid
import time
from dotenv import load_dotenv

# Configurar entorno Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('.env')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'totem_backend.settings')
import django
django.setup()

# Importar dependencias reales
from apps.asistente_ia.ai.orchestrator.hermes_agent import Hermes
from apps.asistente_ia.ai.parsers.response_parser import intent_engine
from apps.asistente_ia.ai.rag.retriever import rag_engine
from apps.asistente_ia.ai.memory.session_memory import conversation_manager
from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client

def simular_conversacion_comercial():
    print("="*60)
    print("🚀 INICIANDO SIMULACIÓN DE FLUJO COMERCIAL COMPLETO")
    print("="*60)
    
    hermes = Hermes(intent_engine, rag_engine, conversation_manager, openrouter_client)
    session_token = str(uuid.uuid4())
    print(f"[Sistema] Nueva sesión generada: {session_token}\n")
    
    mensajes_simulados = [
        # 1. Saludo inicial (Debería usar modelo rápido y catalogar como general_chat)
        "Hola, buenas tardes.",
        
        # 2. Exploración (Debería usar modelo rápido, general_chat)
        "Quiero hacer un viaje pero no sé a dónde ir. ¿Qué me recomiendas?",
        
        # 3. Intención de Booking (Debería activar RAG, modelo GPT-4o, TourismAgent scoring)
        "Me interesa ir a Cusco o al Valle Sagrado. Somos 4 personas y tenemos presupuesto premium.",
        
        # 4. Intención Comercial Fuerte (Debería activar LeadAgent, ToolCalling y Scoring alto)
        "Me encanta la idea de Cusco. Quiero reservar ese paquete premium para las 4 personas en julio. ¿Cómo pago?"
    ]
    
    for i, msg in enumerate(mensajes_simulados, 1):
        print(f"\n" + "-"*50)
        print(f"👤 TURNO {i} - USUARIO: {msg}")
        print("-"  *50)
        
        start_time = time.time()
        
        # Guardar en memoria y procesar
        conversation_manager.add_message(session_token, "user", msg)
        resultado = hermes.run(session_token, msg, "es")
        
        duration = time.time() - start_time
        
        print(f"\n🤖 ASISTENTE:\n{resultado['response']}\n")
        
        # Mostrar los metadatos internos del sistema multi-agente
        intent = resultado['intent']
        print("📊 [DIAGNÓSTICO INTERNO]")
        print(f"  • Tiempo de respuesta: {duration:.2f}s")
        print(f"  • Intención Detectada: {intent.intent_type.upper()}")
        print(f"  • Confianza: {intent.confidence_score * 100}%")
        print(f"  • Entidades Extraídas: Destino={intent.destination}, Presupuesto={intent.budget_range}, Grupo={intent.group_size}")
        print(f"  • Matches RAG: {len(resultado['matches'])}")
        
        # Guardar respuesta del asistente
        conversation_manager.add_message(session_token, "assistant", resultado['response'])
        
        # Pausa pequeña para simular lectura
        time.sleep(1)

    print("\n" + "="*60)
    print("✅ SIMULACIÓN COMERCIAL FINALIZADA")
    print("="*60)

if __name__ == "__main__":
    simular_conversacion_comercial()
