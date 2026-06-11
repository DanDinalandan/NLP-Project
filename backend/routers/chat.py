import json
from fastapi import APIRouter, HTTPException

from database.init_db import get_connection
from models.schemas import ChatMessageCreate
from services.chroma_service import query_chunks
from services.ollama_service import generate, get_active_model

router = APIRouter()

RAG_PROMPT = """\
You are a study assistant. Answer the student's question using ONLY the context provided below.
If the answer is not in the context, say "I don't have information on that in your materials."

Context:
{context}

---
Question: {question}

Answer concisely (150–200 words):"""


def row_to_dict(row) -> dict:
    d = dict(row)
    d["citations"] = json.loads(d.get("citations", "[]"))
    return d


@router.get("/folders/{folder_id}/chat")
def get_chat_history(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM chat_messages WHERE folder_id=? ORDER BY created_at ASC",
        (folder_id,),
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@router.post("/folders/{folder_id}/chat")
async def send_chat_message(folder_id: int, body: ChatMessageCreate):
    question = body.content.strip()
    if not question:
        raise HTTPException(400, "Empty message")

    # Save user message
    conn = get_connection()
    conn.execute(
        "INSERT INTO chat_messages(folder_id,role,content,citations) VALUES(?,?,?,?)",
        (folder_id, "user", question, "[]"),
    )
    conn.commit()
    conn.close()

    # Handle empty file selection: no context available
    if body.file_ids is not None and len(body.file_ids) == 0:
        answer = (
            "No source files are selected. Please select at least one file "
            "in the chat settings to enable context-grounded answers."
        )
        citations = []
    else:
        # Retrieve relevant chunks — optionally filtered by selected file IDs
        chunks = query_chunks(folder_id, question, n_results=3, file_ids=body.file_ids)

        if not chunks:
            answer = "I don't have any study materials in this folder yet. Please upload files first."
            citations = []
        else:
            context = "\n\n---\n\n".join(
                f"[{c['metadata']['file_name']}, pp.{c['metadata']['page_range']}]\n{c['text']}"
                for c in chunks
            )
            citations = [
                {"file_name": c["metadata"]["file_name"], "page_range": c["metadata"]["page_range"]}
                for c in chunks
            ]

            model  = get_active_model(get_connection())
            prompt = RAG_PROMPT.format(context=context[:3000], question=question)
            answer = await generate(model, prompt, max_tokens=250)

    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO chat_messages(folder_id,role,content,citations) VALUES(?,?,?,?)",
        (folder_id, "assistant", answer, json.dumps(citations)),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM chat_messages WHERE id=?", (cur.lastrowid,)
    ).fetchone()
    conn.close()

    return row_to_dict(row)


@router.delete("/folders/{folder_id}/chat")
def clear_chat_history(folder_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM chat_messages WHERE folder_id=?", (folder_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
