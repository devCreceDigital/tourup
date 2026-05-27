import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv('.env')

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
    "Content-Type": "application/json"
}
data = {
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "hola"}]
}
data_bytes = json.dumps(data).encode('utf-8')

req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

try:
    print("Making request...")
    with urllib.request.urlopen(req, timeout=10) as resp:
        print("Status:", resp.status)
        print("Body:", resp.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
