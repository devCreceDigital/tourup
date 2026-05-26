import os
import sys
from dotenv import load_dotenv

# Configurar entorno Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('.env')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'totem_backend.settings')
import django
django.setup()

# Importar los servicios reales de la arquitectura multi-agente
from apps.asistente_ia.ai.orchestrator.hermes_agent import Hermes
from apps.asistente_ia.ai.parsers.response_parser import intent_engine
from apps.asistente_ia.ai.rag.retriever import rag_engine
from apps.asistente_ia.ai.memory.session_memory import conversation_manager
from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client
import uuid

def probar_flujo_agentes():
    print("="*50)
    print("🚀 INICIANDO PRUEBA DEL ORQUESTADOR MULTI-AGENTE HERMES")
    print("="*50)
    
    # 1. Crear instancia del orquestador (tal como se hace en views.py)
    hermes = Hermes(
        intent_engine=intent_engine,
        rag_engine=rag_engine,
        conversation_manager=conversation_manager,
        openrouter_client=openrouter_client
    )
    
    # 2. Generar un token de sesión falso para la prueba
    session_token = str(uuid.uuid4())
    print(f"[Sistema] Sesión creada: {session_token}")
    
    # Simular mensaje de bienvenida del asistente
    conversation_manager.add_message(session_token, "assistant", "Hola, soy tu asistente de viajes. ¿A dónde te gustaría ir?")
    
    # 3. Primer mensaje del usuario (Vago)
    mensaje_1 = "sorprendeme"
    print(f"\n👤 USUARIO: {mensaje_1}")
    
    # Guardar en memoria y ejecutar Hermes
    conversation_manager.add_message(session_token, "user", mensaje_1)
    resultado_1 = hermes.run(session_token, mensaje_1, "es")
    
    print(f"\n🤖 ASISTENTE: {resultado_1['response']}")
    print(f"   (Intent Detectado: {resultado_1['intent'].intent_type} | Confianza: {resultado_1['intent'].confidence_score})")
    
    # Guardar respuesta en memoria
    conversation_manager.add_message(session_token, "assistant", resultado_1['response'])
    
    # 4. Segundo mensaje del usuario (Búsqueda específica para forzar RAG)
    mensaje_2 = "Quiero ir a Cusco por 5 dias, somos 2 personas, presupuesto premium"
    print(f"\n👤 USUARIO: {mensaje_2}")
    
    # Guardar en memoria y ejecutar Hermes
    conversation_manager.add_message(session_token, "user", mensaje_2)
    resultado_2 = hermes.run(session_token, mensaje_2, "es")
    
    print(f"\n🤖 ASISTENTE: {resultado_2['response']}")
    print(f"   (Intent Detectado: {resultado_2['intent'].intent_type} | Destino: {resultado_2['intent'].destination})")
    print(f"   (Matches RAG encontrados: {len(resultado_2['matches'])})")
    
    print("\n" + "="*50)
    print("✅ PRUEBA FINALIZADA")
    print("="*50)

if __name__ == "__main__":
    probar_flujo_agentes()
