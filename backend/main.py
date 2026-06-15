"""
ReviewBot FastAPI sidecar.

Runs as a background process started by Tauri on app launch.
Listens on 127.0.0.1:8765 — not exposed externally.

The file upload endpoint parses files immediately and stores the Markdown in SQLite.
Generation is triggered separately (POST /folders/{id}/generate) and runs as background tasks.
"""
import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Load .env before anything reads os.environ (no-op when running as built .exe)
from dotenv import load_dotenv
load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
# All modules use `logging.getLogger(__name__)` — this root config applies to all.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
# Quiet noisy third-party loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("chromadb").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure this file's directory is on sys.path when running via PyInstaller
if getattr(sys, "frozen", False):
    base = Path(sys._MEIPASS)
    sys.path.insert(0, str(base))

from database.init_db import init_db
from routers.folders import router as folders_router
from routers.outputs import router as outputs_router
from routers.chat import router as chat_router
from routers.settings import router as settings_router
from routers.search import router as search_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="ReviewBot API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(folders_router)
app.include_router(outputs_router)
app.include_router(chat_router)
app.include_router(settings_router)
app.include_router(search_router)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
