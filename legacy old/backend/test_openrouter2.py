import os
import sys
print("1")
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('.env')
print("2")

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'totem_backend.settings')
import django
django.setup()
print("3")

from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client
print("4")

try:
    print("Testing chat...")
    msg = openrouter_client.chat([{"role": "user", "content": "hola"}])
    print("Chat success! Reply:", msg)
except Exception as e:
    print("Chat error:", type(e).__name__, e)

try:
    print("Testing embed...")
    vec = openrouter_client.embed("hola", model="openai/text-embedding-3-small")
    print("Embed success! Vector length:", len(vec))
except Exception as e:
    print("Embed error:", type(e).__name__, e)
