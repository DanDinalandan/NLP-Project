import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response, StreamingResponse

from database.init_db import get_connection
from services.docx_service import (
    flashcards_to_docx_bytes,
    markdown_to_docx_bytes,
    mcqs_to_csv_str,
    mcqs_to_docx_bytes,
)

router = APIRouter()


# ── FIB endpoints ─────────────────────────────────────────────────────────────

@router.get("/folders/{folder_id}/fibs")
def list_fibs(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM fibs WHERE folder_id=? ORDER BY created_at ASC", (folder_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/fibs", status_code=201)
def create_fib(body: dict):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO fibs(folder_id,file_id,before_blank,after_blank,answer,hint,is_manual) "
        "VALUES(?,?,?,?,?,?,1)",
        (body["folder_id"], body.get("file_id"),
         body["before_blank"], body.get("after_blank", ""),
         body["answer"], body.get("hint", "")),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM fibs WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@router.put("/fibs/{fib_id}")
def update_fib(fib_id: int, body: dict):
    conn = get_connection()
    conn.execute(
        "UPDATE fibs SET before_blank=?, answer=?, after_blank=?, hint=? WHERE id=?",
        (body["before_blank"], body["answer"],
         body.get("after_blank", ""), body.get("hint", ""), fib_id),
    )
    conn.commit()
    r = conn.execute("SELECT * FROM fibs WHERE id=?", (fib_id,)).fetchone()
    conn.close()
    return row_to_dict(r)


@router.delete("/fibs/{fib_id}")
def delete_fib(fib_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM fibs WHERE id=?", (fib_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


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


@router.delete("/folders/{folder_id}/flashcards/all")
def delete_all_flashcards(folder_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM flashcards WHERE folder_id=?", (folder_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.delete("/folders/{folder_id}/mcqs/all")
def delete_all_mcqs(folder_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM mcqs WHERE folder_id=?", (folder_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.delete("/folders/{folder_id}/fibs/all")
def delete_all_fibs(folder_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM fibs WHERE folder_id=?", (folder_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.delete("/outputs/{output_id}")
def delete_output(output_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM outputs WHERE id=?", (output_id,))
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


@router.put("/mcqs/{mcq_id}")
def update_mcq(mcq_id: int, body: dict):
    conn = get_connection()
    conn.execute(
        "UPDATE mcqs SET question=?, options=?, correct_answer=?, explanation=? WHERE id=?",
        (body["question"], json.dumps(body["options"]), body["correct_answer"],
         body.get("explanation", ""), mcq_id),
    )
    conn.commit()
    r = conn.execute("SELECT * FROM mcqs WHERE id=?", (mcq_id,)).fetchone()
    conn.close()
    d = row_to_dict(r)
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


@router.get("/outputs/{output_id}/content")
def get_output_content(output_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM outputs WHERE id=?", (output_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Output not found")
    content = row["content_markdown"]
    if not content and row["file_id"]:
        # Fallback for old records: use master_reviewer from files table
        conn = get_connection()
        file_row = conn.execute("SELECT master_reviewer FROM files WHERE id=?", (row["file_id"],)).fetchone()
        conn.close()
        content = file_row["master_reviewer"] if file_row else ""
    return {
        "id": row["id"],
        "output_type": row["output_type"],
        "content_markdown": content or "",
    }


@router.get("/outputs/{output_id}/download")
def download_output(output_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM outputs WHERE id=?", (output_id,)).fetchone()
    conn.close()
    if not row or not row["file_path"]:
        raise HTTPException(404, "Output file not found")
    return FileResponse(row["file_path"], filename=row["file_path"].split("/")[-1].split("\\")[-1])


# ── DOCX export for summary / reviewer PDFs ───────────────────────────────────

@router.get("/outputs/{output_id}/export/docx")
def export_output_docx(output_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT o.*, f.name AS folder_name FROM outputs o "
        "JOIN folders f ON f.id = o.folder_id WHERE o.id=?",
        (output_id,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Output not found")

    content = row["content_markdown"]
    if not content:
        # Fallback for records generated before content_markdown was stored
        conn = get_connection()
        file_row = conn.execute("SELECT master_reviewer FROM files WHERE id=?", (row["file_id"],)).fetchone()
        conn.close()
        content = file_row["master_reviewer"] if file_row else ""
    if not content:
        raise HTTPException(400, "No exportable content for this output")

    is_summary = row["output_type"] == "summary_pdf"
    title = f"{'Summary' if is_summary else 'Reviewer'}: {row['folder_name']}"
    safe = row["folder_name"].replace(" ", "_")
    prefix = "summary" if is_summary else "reviewer"

    docx_bytes = markdown_to_docx_bytes(content, title)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{prefix}_{output_id}_{safe}.docx"'},
    )


# ── DOCX / CSV export for flashcards and MCQs ────────────────────────────────

@router.get("/folders/{folder_id}/flashcards/export/docx")
def export_flashcards_docx(folder_id: int):
    conn = get_connection()
    cards = conn.execute(
        "SELECT * FROM flashcards WHERE folder_id=? ORDER BY created_at ASC", (folder_id,)
    ).fetchall()
    folder = conn.execute("SELECT name FROM folders WHERE id=?", (folder_id,)).fetchone()
    conn.close()
    if not cards:
        raise HTTPException(404, "No flashcards found for this folder")

    folder_name = folder["name"] if folder else str(folder_id)
    docx_bytes = flashcards_to_docx_bytes([dict(r) for r in cards], folder_name)
    safe = folder_name.replace(" ", "_")
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="flashcards_{folder_id}_{safe}.docx"'},
    )


@router.get("/folders/{folder_id}/mcqs/export/docx")
def export_mcqs_docx(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM mcqs WHERE folder_id=? ORDER BY created_at ASC", (folder_id,)
    ).fetchall()
    folder = conn.execute("SELECT name FROM folders WHERE id=?", (folder_id,)).fetchone()
    conn.close()
    if not rows:
        raise HTTPException(404, "No MCQs found for this folder")

    mcqs = [dict(r) for r in rows]
    folder_name = folder["name"] if folder else str(folder_id)
    docx_bytes = mcqs_to_docx_bytes(mcqs, folder_name)
    safe = folder_name.replace(" ", "_")
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="mcqs_{folder_id}_{safe}.docx"'},
    )


@router.get("/folders/{folder_id}/mcqs/export/csv")
def export_mcqs_csv(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM mcqs WHERE folder_id=? ORDER BY created_at ASC", (folder_id,)
    ).fetchall()
    conn.close()
    if not rows:
        raise HTTPException(404, "No MCQs found for this folder")

    csv_str = mcqs_to_csv_str([dict(r) for r in rows])
    return Response(
        content=csv_str.encode("utf-8"),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="mcqs_{folder_id}.csv"'},
    )
