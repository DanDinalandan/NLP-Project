import os
import shutil
import subprocess
import tempfile
import threading
import httpx
import psutil
from typing import Optional, List

# In-memory pull job tracker  { job_id: { status, progress, model, error } }
_pull_jobs: dict = {}

# In-memory install job tracker  { job_id: { status, progress, error } }
# status: "downloading" | "installing" | "done" | "error"
_install_jobs: dict = {}

OLLAMA_INSTALLER_URL = "https://ollama.com/download/OllamaSetup.exe"


def start_ollama_install(job_id: str) -> None:
    _install_jobs[job_id] = {"status": "downloading", "progress": 0, "error": ""}
    t = threading.Thread(target=_do_install, args=(job_id,), daemon=True)
    t.start()


def get_install_status(job_id: str) -> dict:
    return _install_jobs.get(job_id, {"status": "unknown", "progress": 0, "error": ""})


def _do_install(job_id: str) -> None:
    tmp_dir = tempfile.mkdtemp(prefix="reviewbot_ollama_")
    installer_path = os.path.join(tmp_dir, "OllamaSetup.exe")
    try:
        # ── Download ──────────────────────────────────────────────
        with httpx.Client(timeout=None, follow_redirects=True) as client:
            with client.stream("GET", OLLAMA_INSTALLER_URL) as resp:
                resp.raise_for_status()
                total = int(resp.headers.get("content-length", 0))
                downloaded = 0
                with open(installer_path, "wb") as f:
                    for chunk in resp.iter_bytes(chunk_size=65536):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total:
                            _install_jobs[job_id]["progress"] = min(int(downloaded / total * 88), 88)

        # ── Silent install ────────────────────────────────────────
        _install_jobs[job_id].update({"status": "installing", "progress": 90})
        result = subprocess.run(
            [installer_path, "/S"],
            capture_output=True,
            timeout=300,
        )
        if result.returncode == 0:
            _install_jobs[job_id] = {"status": "done", "progress": 100, "error": ""}
        else:
            stderr = result.stderr.decode(errors="replace")
            _install_jobs[job_id] = {
                "status": "error", "progress": 0,
                "error": f"Installer exited with code {result.returncode}. {stderr[:200]}",
            }
    except Exception as e:
        _install_jobs[job_id] = {"status": "error", "progress": 0, "error": str(e)[:300]}
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def start_pull(job_id: str, model: str) -> None:
    """Start an ollama pull in a background thread. Poll get_pull_status() for progress."""
    _pull_jobs[job_id] = {"status": "starting", "progress": 0, "model": model, "error": ""}
    t = threading.Thread(target=_do_pull, args=(job_id, model), daemon=True)
    t.start()


def get_pull_status(job_id: str) -> dict:
    return _pull_jobs.get(job_id, {"status": "unknown", "progress": 0, "model": "", "error": ""})


def _do_pull(job_id: str, model: str) -> None:
    import json
    try:
        with httpx.Client(timeout=None) as client:
            with client.stream(
                "POST",
                f"{OLLAMA_BASE}/api/pull",
                json={"model": model, "stream": True},
            ) as r:
                for line in r.iter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                    except Exception:
                        continue
                    status = data.get("status", "")
                    completed = data.get("completed", 0)
                    total = data.get("total", 0)
                    pct = int((completed / total) * 100) if total else 0
                    _pull_jobs[job_id] = {
                        "status": "downloading" if status != "success" else "done",
                        "progress": 100 if status == "success" else pct,
                        "model": model,
                        "error": "",
                    }
        _pull_jobs[job_id]["status"] = "done"
        _pull_jobs[job_id]["progress"] = 100
    except Exception as e:
        _pull_jobs[job_id] = {"status": "error", "progress": 0, "model": model, "error": str(e)}


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
    # 10-minute timeout — llama3.1:8b on CPU can take several minutes per call
    async with httpx.AsyncClient(timeout=600.0) as client:
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
