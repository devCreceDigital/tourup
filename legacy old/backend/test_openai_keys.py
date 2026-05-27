from openai import OpenAI
import os
client = OpenAI(api_key="fake")
try:
    client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "hola", "ts": "2023-01-01"}]
    )
except Exception as e:
    print("Error:", e)
