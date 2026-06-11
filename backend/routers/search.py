import os
from fastapi import APIRouter
import httpx

router = APIRouter()


@router.get("/search")
async def search_public(q: str = ""):
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY", "")

    if not supabase_url or not supabase_key or not q.strip():
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{supabase_url}/rest/v1/public_reviewers",
                headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"},
                params={"select": "*", "or": f"(title.ilike.%{q}%,description.ilike.%{q}%)"},
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass

    return []
