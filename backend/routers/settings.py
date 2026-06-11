import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from database.init_db import get_connection, get_db_path
from models.schemas import LoginRequest
from services.ollama_service import check_ollama_status

router = APIRouter()


def get_dir_size(path: Path) -> int:
    if not path.exists():
        return 0
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            total += p.stat().st_size
    return total


@router.get("/settings/ollama")
async def ollama_status():
    return await check_ollama_status()


@router.get("/settings/storage")
def storage_info():
    app_data = os.environ.get("APPDATA", str(Path.home()))
    base = Path(app_data) / "ReviewBot"

    db_size = get_db_path().stat().st_size if get_db_path().exists() else 0
    outputs_size = get_dir_size(base / "outputs")
    chroma_size = get_dir_size(base / "chroma")

    return {
        "db_size_bytes": db_size,
        "outputs_size_bytes": outputs_size,
        "chroma_size_bytes": chroma_size,
        "total_bytes": db_size + outputs_size + chroma_size,
    }


@router.delete("/settings/data")
def clear_data():
    app_data = os.environ.get("APPDATA", str(Path.home()))
    base = Path(app_data) / "ReviewBot"
    for subdir in ["outputs", "chroma"]:
        d = base / subdir
        if d.exists():
            shutil.rmtree(d)
    # Clear all tables
    conn = get_connection()
    for tbl in ["chat_messages", "outputs", "mcqs", "flashcards", "files", "folders"]:
        conn.execute(f"DELETE FROM {tbl}")
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/settings/export")
def export_data():
    conn = get_connection()
    folders    = [dict(r) for r in conn.execute("SELECT * FROM folders").fetchall()]
    files      = [dict(r) for r in conn.execute("SELECT id, folder_id, original_name, file_type, status, chunk_count, created_at FROM files").fetchall()]
    flashcards = [dict(r) for r in conn.execute("SELECT * FROM flashcards").fetchall()]
    mcqs       = [dict(r) for r in conn.execute("SELECT * FROM mcqs").fetchall()]
    conn.close()
    return {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "version": 1,
        "folders":    folders,
        "files":      files,
        "flashcards": flashcards,
        "mcqs":       mcqs,
    }


@router.post("/settings/auth/login")
async def login(body: LoginRequest):
    try:
        import httpx
        supabase_url = os.environ.get("SUPABASE_URL", "")
        supabase_key = os.environ.get("SUPABASE_ANON_KEY", "")
        if not supabase_url or not supabase_key:
            raise HTTPException(503, "Supabase not configured")

        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                headers={"apikey": supabase_key, "Content-Type": "application/json"},
                json={"email": body.email, "password": body.password},
            )
            if r.status_code != 200:
                # Try sign up
                r2 = await client.post(
                    f"{supabase_url}/auth/v1/signup",
                    headers={"apikey": supabase_key, "Content-Type": "application/json"},
                    json={"email": body.email, "password": body.password},
                )
                if r2.status_code not in (200, 201):
                    raise HTTPException(401, "Invalid credentials")
                data = r2.json()
            else:
                data = r.json()

        token = data.get("access_token", "")
        user = data.get("user", {})

        conn = get_connection()
        conn.execute("UPDATE app_settings SET value=? WHERE key='supabase_token'", (token,))
        conn.execute("UPDATE app_settings SET value=? WHERE key='supabase_user_id'", (user.get("id", ""),))
        conn.execute("UPDATE app_settings SET value=? WHERE key='supabase_email'", (body.email,))
        conn.commit()
        conn.close()

        return {"email": body.email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/settings/auth/logout")
def logout():
    conn = get_connection()
    conn.execute("UPDATE app_settings SET value='' WHERE key IN ('supabase_token','supabase_user_id','supabase_email')")
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/settings")
def get_settings():
    conn = get_connection()
    rows = conn.execute("SELECT key, value FROM app_settings").fetchall()
    conn.close()
    data = {r["key"]: r["value"] for r in rows}

    supabase_user = None
    if data.get("supabase_user_id") and data.get("supabase_email"):
        supabase_user = {"id": data["supabase_user_id"], "email": data["supabase_email"]}

    return {
        "theme": data.get("theme", "light"),
        "selected_model": data.get("selected_model") or None,
        "supabase_user": supabase_user,
    }
