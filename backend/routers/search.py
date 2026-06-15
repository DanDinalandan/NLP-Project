from fastapi import APIRouter, HTTPException
import httpx

from config import SUPABASE_URL, SUPABASE_ANON_KEY

router = APIRouter()

_HEADERS = lambda: {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}


@router.get("/search")
async def search_public(q: str = ""):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not q.strip():
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/public_reviewers",
                headers=_HEADERS(),
                params={
                    "select": "id,folder_name,created_at",
                    "folder_name": f"ilike.%{q}%",
                    "order": "created_at.desc",
                    "limit": "30",
                },
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass

    return []


@router.get("/search/{reviewer_id}")
async def get_public_reviewer(reviewer_id: str):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(503, "Supabase not configured")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/public_reviewers",
                headers=_HEADERS(),
                params={
                    "select": "id,folder_name,content_markdown,created_at",
                    "id": f"eq.{reviewer_id}",
                    "limit": "1",
                },
            )
            if r.status_code == 200 and r.json():
                return r.json()[0]
    except Exception as e:
        raise HTTPException(500, str(e))

    raise HTTPException(404, "Reviewer not found")
