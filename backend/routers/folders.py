import asyncio
import json
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse

from database.init_db import get_connection
from models.schemas import FolderCreate, FolderUpdate
from services.parsing_service import parse_file, split_into_chunks
from services.chroma_service import add_chunks, delete_folder_embeddings, delete_file_embeddings
from services.ollama_service import get_active_model
from services.generation_service import (
    generate_chunk_reviewer,
    aggregate_reviewers,
    generate_flashcards,
    generate_mcqs,
    generate_summary,
    generate_fib,
    generate_title,
)
from services.pdf_service import generate_pdf

router = APIRouter()


def row_to_dict(row) -> dict:
    return dict(row)


@router.get("/folders")
def list_folders():
    conn = get_connection()
    rows = conn.execute("""
        SELECT f.*,
               (SELECT COUNT(*) FROM files WHERE folder_id = f.id) as file_count,
               (SELECT COUNT(*) FROM outputs WHERE folder_id = f.id) as output_count
        FROM folders f ORDER BY f.updated_at DESC
    """).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@router.post("/folders", status_code=201)
def create_folder(body: FolderCreate):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO folders(name) VALUES(?)", (body.name,)
    )
    conn.commit()
    row = conn.execute(
        "SELECT *, 0 as file_count, 0 as output_count FROM folders WHERE id=?",
        (cur.lastrowid,),
    ).fetchone()
    conn.close()
    return row_to_dict(row)


@router.put("/folders/{folder_id}")
def update_folder(folder_id: int, body: FolderUpdate):
    conn = get_connection()
    if body.name:
        conn.execute("UPDATE folders SET name=? WHERE id=?", (body.name, folder_id))
    if body.privacy:
        conn.execute("UPDATE folders SET privacy=? WHERE id=?", (body.privacy, folder_id))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int):
    try:
        delete_folder_embeddings(folder_id)
    except Exception:
        pass  # Never let ChromaDB errors block folder deletion
    conn = get_connection()
    conn.execute("DELETE FROM folders WHERE id=?", (folder_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/folders/{folder_id}/files")
def list_files(folder_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM files WHERE folder_id=? ORDER BY created_at DESC", (folder_id,)
    ).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@router.post("/folders/{folder_id}/files", status_code=201)
async def upload_file(folder_id: int, file: UploadFile = File(...)):
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "txt"

    # Reject duplicate filenames in the same folder
    conn = get_connection()
    existing = conn.execute(
        "SELECT id FROM files WHERE folder_id=? AND original_name=?",
        (folder_id, file.filename),
    ).fetchone()
    conn.close()
    if existing:
        raise HTTPException(
            409,
            f"'{file.filename}' already exists in this folder. Delete it first if you want to replace it.",
        )

    # Parse immediately on upload
    try:
        markdown = parse_file(content, file.filename, ext)
        status = "pending"
    except Exception as e:
        markdown = ""
        status = "error"

    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO files(folder_id, original_name, file_type, markdown_content, status) VALUES(?,?,?,?,?)",
        (folder_id, file.filename, ext, markdown, status),
    )
    file_id = cur.lastrowid
    conn.commit()

    row = conn.execute("SELECT * FROM files WHERE id=?", (file_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@router.get("/files/{file_id}")
def get_file(file_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM files WHERE id=?", (file_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "File not found")
    return row_to_dict(row)


@router.put("/files/{file_id}/title")
def update_file_title(file_id: int, body: dict):
    title = (body.get("title") or "").strip()[:200]
    conn = get_connection()
    conn.execute("UPDATE files SET generated_title=? WHERE id=?", (title, file_id))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/files/{file_id}/cancel")
def cancel_file(file_id: int):
    conn = get_connection()
    row = conn.execute("SELECT status FROM files WHERE id=?", (file_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "File not found")
    if row["status"] not in ('done', 'error'):
        conn.execute(
            "UPDATE files SET status='error', error_message='[Cancelled]' WHERE id=?",
            (file_id,),
        )
        conn.commit()
    conn.close()
    return {"ok": True}


@router.delete("/files/{file_id}")
def delete_file(file_id: int):
    conn = get_connection()
    row = conn.execute("SELECT folder_id FROM files WHERE id=?", (file_id,)).fetchone()
    if row:
        delete_file_embeddings(row["folder_id"], file_id)
    conn.execute("DELETE FROM files WHERE id=?", (file_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/folders/{folder_id}/generate")
async def generate_folder(folder_id: int, background_tasks: BackgroundTasks, body: dict = None):
    body      = body or {}
    file_ids  = body.get("file_ids")   # list[int] | None  — None means all pending
    options   = body.get("options", {})

    conn = get_connection()
    if file_ids:
        # Explicit selection — all statuses allowed (done files can be re-generated)
        placeholders = ",".join("?" * len(file_ids))
        files = conn.execute(
            f"SELECT * FROM files WHERE folder_id=? AND id IN ({placeholders})",
            [folder_id, *file_ids],
        ).fetchall()
        # Reset error/done files back to pending so the pipeline can reprocess them
        for f in files:
            if f["status"] in ("error", "done"):
                conn.execute(
                    "UPDATE files SET status='pending', error_message='' WHERE id=?",
                    (f["id"],),
                )
        conn.commit()
    else:
        files = conn.execute(
            "SELECT * FROM files WHERE folder_id=? AND status NOT IN ('done','error')",
            (folder_id,),
        ).fetchall()
    conn.close()

    for file_row in files:
        background_tasks.add_task(_run_pipeline, dict(file_row), options)

    return {"queued": len(files)}


def _is_cancelled(file_id: int) -> bool:
    conn = get_connection()
    row = conn.execute("SELECT status, error_message FROM files WHERE id=?", (file_id,)).fetchone()
    conn.close()
    return bool(row and row["status"] == "error" and row["error_message"] == "[Cancelled]")


async def _run_pipeline(file: dict, options: dict = None):
    options   = options or {}
    gen_fc    = bool(options.get("generate_flashcards", True))
    gen_mcq   = bool(options.get("generate_mcqs",       True))
    gen_fib   = bool(options.get("generate_fibs",       True))
    gen_sum   = bool(options.get("generate_summary",    True))
    fc_count  = int(options.get("flashcard_count",  15))
    mcq_count = int(options.get("mcq_count",        10))
    fib_count = int(options.get("fib_count",         7))
    sum_kw    = bool(options.get("summary_keywords", True))

    file_id = file["id"]
    folder_id = file["folder_id"]

    def set_status(status: str, error: str = ""):
        conn = get_connection()
        conn.execute(
            "UPDATE files SET status=?, error_message=? WHERE id=?",
            (status, error, file_id),
        )
        conn.commit()
        conn.close()

    try:
        # Re-read file content from database (we store markdown after parsing)
        conn = get_connection()
        row = conn.execute("SELECT * FROM files WHERE id=?", (file_id,)).fetchone()
        conn.close()
        file_data = dict(row)

        # Step 1: Parse (if not done yet)
        set_status("parsing")
        # The file content needs to be re-fetched — in this design we store
        # the raw bytes path. For simplicity, we re-upload flow stores markdown.
        markdown = file_data.get("markdown_content") or ""

        if not markdown:
            set_status("error", "No content to process — upload file again")
            return

        if _is_cancelled(file_id): return

        # Step 2: Chunk
        set_status("chunking")
        chunks = split_into_chunks(markdown, pages_per_chunk=5)
        page_ranges = [
            f"{i*5+1}-{min((i+1)*5, len(chunks)*5)}"
            for i in range(len(chunks))
        ]

        conn = get_connection()
        conn.execute(
            "UPDATE files SET chunk_count=? WHERE id=?", (len(chunks), file_id)
        )
        conn.commit()
        conn.close()

        # Embed chunks into ChromaDB
        add_chunks(folder_id, file_id, file_data["original_name"], chunks, page_ranges)

        if _is_cancelled(file_id): return

        # Step 3: Generate chunk-level reviewers (sequential — Ollama queues anyway)
        set_status("reviewing")
        model = get_active_model(get_connection())
        chunk_reviews = []
        for chunk in chunks:
            if _is_cancelled(file_id): return
            chunk_reviews.append(await generate_chunk_reviewer(model, chunk))

        if _is_cancelled(file_id): return

        # Step 4: Aggregate to master reviewer
        set_status("aggregating")
        master_reviewer = await aggregate_reviewers(model, list(chunk_reviews))

        # Generate title alongside other tasks
        title = await generate_title(model, master_reviewer)

        conn = get_connection()
        conn.execute(
            "UPDATE files SET master_reviewer=?, generated_title=? WHERE id=?",
            (master_reviewer, title, file_id),
        )
        conn.commit()
        conn.close()

        if _is_cancelled(file_id): return

        # Step 5: Generate outputs (only selected types)
        set_status("generating")

        # Sequential — Ollama is single-threaded locally; concurrent requests
        # cause all but the first to timeout and silently return empty.
        flashcards_data = await generate_flashcards(model, master_reviewer, fc_count) if gen_fc  else []
        if _is_cancelled(file_id): return
        mcqs_data       = await generate_mcqs(model, master_reviewer, mcq_count)      if gen_mcq else []
        if _is_cancelled(file_id): return
        summary_text    = await generate_summary(model, master_reviewer, sum_kw)      if gen_sum else ""
        if _is_cancelled(file_id): return
        fibs_data       = await generate_fib(model, master_reviewer, fib_count)       if gen_fib else []

        conn = get_connection()

        # Save flashcards
        for card in flashcards_data:
            front = card.get("front", "")
            back = card.get("back", "")
            if front and back:
                conn.execute(
                    "INSERT INTO flashcards(folder_id,file_id,front,back) VALUES(?,?,?,?)",
                    (folder_id, file_id, front, back),
                )

        # Save MCQs
        for q in mcqs_data:
            question = q.get("question", "")
            options = q.get("options", [])
            correct = q.get("correct_answer", "A")
            explanation = q.get("explanation", "")
            if question and options:
                conn.execute(
                    "INSERT INTO mcqs(folder_id,file_id,question,options,correct_answer,explanation) VALUES(?,?,?,?,?,?)",
                    (folder_id, file_id, question, json.dumps(options), correct, explanation),
                )

        # Save FIBs (either before OR after is required, but answer is always required)
        for fib in fibs_data:
            before = fib.get("before", "").strip()
            after  = fib.get("after", "").strip()
            answer = fib.get("answer", "").strip()
            if answer and (before or after):
                conn.execute(
                    "INSERT INTO fibs(folder_id,file_id,before_blank,after_blank,answer,hint) VALUES(?,?,?,?,?,?)",
                    (folder_id, file_id, before, after, answer, fib.get("hint", "")),
                )

        conn.commit()
        conn.close()

        # Generate PDFs
        safe_name = "".join(c for c in file_data["original_name"] if c.isalnum() or c in "._- ")

        conn = get_connection()

        if gen_sum and summary_text:
            summary_path = generate_pdf(
                summary_text,
                f"summary_{file_id}_{safe_name}.pdf",
                f"Summary: {file_data['original_name']}",
            )
            conn.execute(
                "INSERT INTO outputs(folder_id,file_id,output_type,file_path,content_markdown) VALUES(?,?,?,?,?)",
                (folder_id, file_id, "summary_pdf", summary_path, summary_text),
            )

        reviewer_path = generate_pdf(
            master_reviewer,
            f"reviewer_{file_id}_{safe_name}.pdf",
            f"Reviewer: {file_data['original_name']}",
        )
        conn.execute(
            "INSERT INTO outputs(folder_id,file_id,output_type,file_path,content_markdown) VALUES(?,?,?,?,?)",
            (folder_id, file_id, "reviewer_pdf", reviewer_path, master_reviewer),
        )
        conn.commit()
        conn.close()

        set_status("done")

    except Exception as e:
        set_status("error", str(e)[:500])
