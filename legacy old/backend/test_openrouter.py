import os
import sys
import django

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from apps.asistente_ia.ai.llm.openrouter_client import openrouter_client

try:
    print("Testing embed...")
    vec = openrouter_client.embed("hola", model="openai/text-embedding-3-small")
    print("Embed success! Vector length:", len(vec))
except Exception as e:
    print("Embed error:", e)

try:
    print("Testing chat...")
    msg = openrouter_client.chat([{"role": "user", "content": "hola"}])
    print("Chat success! Reply:", msg)
except Exception as e:
    print("Chat error:", e)
