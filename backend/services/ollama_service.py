import httpx
import psutil
from typing import Optional, List


OLLAMA_BASE = "http://127.0.0.1:11434"

MODEL_REQUIREMENTS = {
    "phi3:mini": 4,
    "llama3.2:3b": 6,
    "llama3.1:8b": 10,
}


def get_ram_gb() -> int:
    return round(psutil.virtual_memory().total / (1024 ** 3))


def get_recommended_model(ram_gb: int) -> Optional[str]:
    if ram_gb >= 16:
        return "llama3.1:8b"
    elif ram_gb >= 8:
        return "llama3.2:3b"
    return None


async def check_ollama_status() -> dict:
    ram_gb = get_ram_gb()
    recommended = get_recommended_model(ram_gb)
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            models = [m["name"] for m in r.json().get("models", [])]
            return {
                "running": True,
                "models": models,
                "recommended_model": recommended,
                "ram_gb": ram_gb,
            }
    except Exception:
        return {
            "running": False,
            "models": [],
            "recommended_model": recommended,
            "ram_gb": ram_gb,
        }


async def generate(model: str, prompt: str, max_tokens: int = 1500) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"{OLLAMA_BASE}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
        )
        r.raise_for_status()
        return r.json()["response"]


def get_active_model(db_conn) -> str:
    row = db_conn.execute(
        "SELECT value FROM app_settings WHERE key = 'selected_model'"
    ).fetchone()
    model = row["value"] if row else ""
    if not model:
        ram_gb = get_ram_gb()
        model = get_recommended_model(ram_gb) or "llama3.2:3b"
    return model
