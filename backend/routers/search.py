from fastapi import APIRouter
import httpx

from config import SUPABASE_URL, SUPABASE_ANON_KEY

router = APIRouter()


@router.get("/search")
async def search_public(q: str = ""):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not q.strip():
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/public_reviewers",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                },
                params={"select": "*", "or": f"(title.ilike.%{q}%,description.ilike.%{q}%)"},
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass

    return []
