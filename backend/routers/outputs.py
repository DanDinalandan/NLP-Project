import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from database.init_db import get_connection

router = APIRouter()


def row_to_dict(row) -> dict:
    return dict(row)


@router.get("/folders/{folder_id}/flashcards")
def list_flashcards(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM flashcards WHERE folder_id=? ORDER BY created_at ASC", (folder_id,)
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@router.post("/flashcards", status_code=201)
def create_flashcard(body: dict):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO flashcards(folder_id,file_id,front,back,is_manual) VALUES(?,?,?,?,1)",
        (body["folder_id"], body.get("file_id"), body["front"], body["back"]),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM flashcards WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return row_to_dict(row)


@router.put("/flashcards/{card_id}")
def update_flashcard(card_id: int, body: dict):
    conn = get_connection()
    conn.execute(
        "UPDATE flashcards SET front=?, back=? WHERE id=?",
        (body["front"], body["back"], card_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM flashcards WHERE id=?", (card_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@router.delete("/flashcards/{card_id}")
def delete_flashcard(card_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM flashcards WHERE id=?", (card_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/folders/{folder_id}/mcqs")
def list_mcqs(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM mcqs WHERE folder_id=? ORDER BY created_at ASC", (folder_id,)
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = row_to_dict(r)
        d["options"] = json.loads(d["options"])
        result.append(d)
    return result


@router.post("/mcqs", status_code=201)
def create_mcq(body: dict):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO mcqs(folder_id,file_id,question,options,correct_answer,explanation,is_manual) VALUES(?,?,?,?,?,?,1)",
        (
            body["folder_id"],
            body.get("file_id"),
            body["question"],
            json.dumps(body["options"]),
            body["correct_answer"],
            body.get("explanation", ""),
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM mcqs WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    d = row_to_dict(row)
    d["options"] = json.loads(d["options"])
    return d


@router.delete("/mcqs/{mcq_id}")
def delete_mcq(mcq_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM mcqs WHERE id=?", (mcq_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/folders/{folder_id}/outputs")
def list_outputs(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM outputs WHERE folder_id=? ORDER BY created_at DESC", (folder_id,)
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@router.get("/outputs/{output_id}/download")
def download_output(output_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM outputs WHERE id=?", (output_id,)).fetchone()
    conn.close()
    if not row or not row["file_path"]:
        raise HTTPException(404, "Output file not found")
    return FileResponse(row["file_path"], filename=row["file_path"].split("/")[-1].split("\\")[-1])
