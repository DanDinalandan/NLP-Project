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
    delete_folder_embeddings(folder_id)
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
async def generate_folder(folder_id: int, background_tasks: BackgroundTasks):
    conn = get_connection()
    files = conn.execute(
        "SELECT * FROM files WHERE folder_id=? AND status NOT IN ('done','error')",
        (folder_id,),
    ).fetchall()
    conn.close()

    for file_row in files:
        background_tasks.add_task(_run_pipeline, dict(file_row))

    return {"queued": len(files)}


async def _run_pipeline(file: dict):
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

        # Step 3: Generate chunk-level reviewers
        set_status("reviewing")
        model = get_active_model(get_connection())
        tasks = [generate_chunk_reviewer(model, chunk) for chunk in chunks]
        chunk_reviews = await asyncio.gather(*tasks)

        # Step 4: Aggregate to master reviewer
        set_status("aggregating")
        master_reviewer = await aggregate_reviewers(model, list(chunk_reviews))

        conn = get_connection()
        conn.execute(
            "UPDATE files SET master_reviewer=? WHERE id=?", (master_reviewer, file_id)
        )
        conn.commit()
        conn.close()

        # Step 5: Generate outputs
        set_status("generating")
        flashcards_data, mcqs_data, summary_text = await asyncio.gather(
            generate_flashcards(model, master_reviewer),
            generate_mcqs(model, master_reviewer),
            generate_summary(model, master_reviewer),
        )

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

        conn.commit()
        conn.close()

        # Generate PDFs
        safe_name = "".join(c for c in file_data["original_name"] if c.isalnum() or c in "._- ")
        summary_path = generate_pdf(
            summary_text,
            f"summary_{file_id}_{safe_name}.pdf",
            f"Summary: {file_data['original_name']}",
        )
        reviewer_path = generate_pdf(
            master_reviewer,
            f"reviewer_{file_id}_{safe_name}.pdf",
            f"Reviewer: {file_data['original_name']}",
        )

        conn = get_connection()
        conn.execute(
            "INSERT INTO outputs(folder_id,file_id,output_type,file_path) VALUES(?,?,?,?)",
            (folder_id, file_id, "summary_pdf", summary_path),
        )
        conn.execute(
            "INSERT INTO outputs(folder_id,file_id,output_type,file_path) VALUES(?,?,?,?)",
            (folder_id, file_id, "reviewer_pdf", reviewer_path),
        )
        conn.commit()
        conn.close()

        set_status("done")

    except Exception as e:
        set_status("error", str(e)[:500])
