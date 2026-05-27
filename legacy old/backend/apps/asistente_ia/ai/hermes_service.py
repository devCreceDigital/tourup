import subprocess
from pathlib import Path

HERMES_PATH = Path("/home/hp/projects/totem-mvp1/hermes-agent")
VENV_PYTHON = HERMES_PATH / ".venv" / "bin" / "python"

def ask_hermes(prompt: str) -> str:
    result = subprocess.run(
        [
            str(VENV_PYTHON),
            "run_agent.py",
            f"--query={prompt}"
        ],
        cwd=HERMES_PATH,
        capture_output=True,
        text=True,
        timeout=120
    )
    
    output = result.stdout
    
    # Extraer solo la respuesta final
    if "FINAL RESPONSE:" in output:
        return output.split("FINAL RESPONSE:")[1].split("👋")[0].strip()
    
    return output.strip()
