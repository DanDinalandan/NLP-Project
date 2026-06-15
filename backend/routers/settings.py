import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

import uuid
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from database.init_db import get_connection, get_db_path
from models.schemas import LoginRequest
from services.ollama_service import (
    check_ollama_status,
    start_pull, get_pull_status,
    start_ollama_install, get_install_status,
)

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


@router.post("/settings/ollama/pull")
async def pull_model(body: dict):
    model = body.get("model", "").strip()
    if not model:
        raise HTTPException(400, "model is required")
    job_id = str(uuid.uuid4())
    start_pull(job_id, model)
    return {"job_id": job_id}


@router.get("/settings/ollama/pull-status/{job_id}")
def pull_status(job_id: str):
    return get_pull_status(job_id)


@router.post("/settings/ollama/install")
def install_ollama():
    job_id = str(uuid.uuid4())
    start_ollama_install(job_id)
    return {"job_id": job_id}


@router.get("/settings/ollama/install-status/{job_id}")
def install_status(job_id: str):
    return get_install_status(job_id)


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
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise HTTPException(503, "Supabase not configured")

        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
                json={"email": body.email, "password": body.password},
            )
            if r.status_code != 200:
                # Try sign up
                r2 = await client.post(
                    f"{SUPABASE_URL}/auth/v1/signup",
                    headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
                    json={"email": body.email, "password": body.password},
                )
                if r2.status_code not in (200, 201):
                    raise HTTPException(401, "Invalid credentials")
                data = r2.json()
            else:
                data = r.json()

        token = data.get("access_token", "")
        user  = data.get("user", {})

        # Supabase returns a user but no access_token when email confirmation is pending
        if not token:
            raise HTTPException(403, "Check your email for a confirmation link before signing in.")

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
        "theme":          data.get("theme", "light"),
        "selected_model": data.get("selected_model") or None,
        "supabase_user":  supabase_user,
        "user_name":      data.get("user_name", ""),
        "user_avatar":    data.get("user_avatar", ""),
        "streak":         int(data.get("streak", "0") or "0"),
    }


@router.put("/settings/profile")
def update_profile(body: dict):
    conn = get_connection()
    for key in ("user_name", "user_avatar"):
        if key in body:
            conn.execute(
                "INSERT OR REPLACE INTO app_settings(key,value) VALUES(?,?)",
                (key, str(body[key])),
            )
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/settings/checkin")
def checkin():
    from datetime import date, timedelta
    today = date.today().isoformat()
    conn = get_connection()
    data = {r["key"]: r["value"] for r in conn.execute("SELECT key,value FROM app_settings").fetchall()}
    last = data.get("last_activity_date", "")
    streak = int(data.get("streak", "0") or "0")

    if last == today:
        conn.close()
        return {"streak": streak, "date": today, "already_checked": True}

    yesterday = (date.today() - timedelta(days=1)).isoformat()
    streak = streak + 1 if last == yesterday else 1

    conn.execute("INSERT OR REPLACE INTO app_settings(key,value) VALUES('last_activity_date',?)", (today,))
    conn.execute("INSERT OR REPLACE INTO app_settings(key,value) VALUES('streak',?)", (str(streak),))
    conn.commit()
    conn.close()
    return {"streak": streak, "date": today, "already_checked": False}


@router.post("/folders/{folder_id}/publish")
async def publish_folder(folder_id: int):
    import httpx
    conn = get_connection()
    folder = conn.execute("SELECT * FROM folders WHERE id=?", (folder_id,)).fetchone()
    if not folder:
        conn.close()
        raise HTTPException(404, "Folder not found")

    data = {r["key"]: r["value"] for r in conn.execute("SELECT key,value FROM app_settings").fetchall()}
    token   = data.get("supabase_token", "")
    user_id = data.get("supabase_user_id", "")
    if not token or not user_id:
        conn.close()
        raise HTTPException(401, "Sign in to an online account first")

    output = conn.execute(
        "SELECT content_markdown FROM outputs WHERE folder_id=? AND output_type='reviewer_pdf' "
        "ORDER BY created_at DESC LIMIT 1",
        (folder_id,),
    ).fetchone()
    content = (output["content_markdown"] or "") if output else ""
    folder_name = folder["name"]
    conn.close()

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(503, "Supabase not configured on server")

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/public_reviewers",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            json={
                "user_id": user_id,
                "folder_name": folder_name,
                "content_markdown": content,
            },
        )
        if r.status_code not in (200, 201):
            raise HTTPException(500, f"Supabase error: {r.text[:200]}")
        result = r.json()
        supabase_id = result[0]["id"] if result else None

    conn = get_connection()
    conn.execute("UPDATE folders SET supabase_id=?, privacy='public' WHERE id=?", (supabase_id, folder_id))
    conn.commit()
    conn.close()
    return {"ok": True, "supabase_id": supabase_id}


@router.delete("/folders/{folder_id}/publish")
async def unpublish_folder(folder_id: int):
    import httpx
    conn = get_connection()
    folder = conn.execute("SELECT * FROM folders WHERE id=?", (folder_id,)).fetchone()
    if not folder:
        conn.close()
        raise HTTPException(404, "Folder not found")

    supabase_id = folder["supabase_id"]
    data = {r["key"]: r["value"] for r in conn.execute("SELECT key,value FROM app_settings").fetchall()}
    token = data.get("supabase_token", "")
    conn.close()

    if supabase_id and token and SUPABASE_URL and SUPABASE_ANON_KEY:
        async with httpx.AsyncClient() as client:
            await client.delete(
                f"{SUPABASE_URL}/rest/v1/public_reviewers?id=eq.{supabase_id}",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {token}",
                },
            )

    conn = get_connection()
    conn.execute("UPDATE folders SET supabase_id=NULL, privacy='private' WHERE id=?", (folder_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
