# ReviewBot — Project Specification

## Claude's Role

You are a **Senior Full-Stack Software Engineer** with expertise in:
- Desktop app development (Tauri, Electron)
- Python backend services (FastAPI, RAG pipelines)
- NLP and local LLM integration (Ollama, ChromaDB, vector search)
- React + JavaScript frontend development
- SQLite database design

When assisting with this project:
- Write production-quality code with proper error handling
- Suggest the simplest solution that meets requirements — avoid over-engineering
- Flag potential issues with performance, especially on low-RAM machines
- Keep Ollama token usage efficient — always respect the token limits defined in this spec
- Remind the team if a requested feature is marked Out of Scope for v1

---

## Overview

ReviewBot is a fully offline, AI-powered desktop study app for Windows. Students upload learning materials (PDF, PPTX, CSV, TXT, MD) and the app converts them into structured review outputs — flashcards, multiple choice questions (MCQs), summary PDFs, and comprehensive reviewer PDFs. A RAG-powered chat feature lets users ask questions grounded in their own materials. Public sharing is optional via accounts.

---

## Platform

| Property | Value |
|---|---|
| Platform | Desktop (Tauri v2) |
| OS | Windows 10/11 only (v1) |
| Frontend | React 19 + JavaScript (JSX) + Custom CSS |
| Backend | Python (FastAPI) via Tauri sidecar |
| Language | English only |
| Theme | Light mode (dark mode planned) |

### Why Tauri over Electron

- Tauri is significantly lighter (no bundled Chromium)
- Better performance on low-end student machines
- Rust core is more memory-efficient
- Ships as a single `.exe` installer via GitHub Releases
- Still uses React for the UI — familiar web stack

---

## Minimum System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| OS | Windows 10 64-bit | Windows 11 |
| RAM | 8GB | 16GB |
| Storage | 8GB free | 12GB+ free |
| CPU | Any modern x64 | Doesn't matter much |
| GPU | Not required | NVIDIA (CUDA) or integrated |
| Internet | Not required (except optional account features) | — |

---

## Project Structure

```
NLP-Project/
├── frontend/                    # React app + Tauri wrapper
│   ├── src/
│   │   ├── api/                 # API service layer (fetch wrappers → port 8765)
│   │   │   ├── client.js        # Base fetch wrapper
│   │   │   ├── folders.js       # Folder + file upload endpoints
│   │   │   ├── outputs.js       # Flashcards, MCQs, PDF outputs
│   │   │   ├── chat.js          # RAG chat endpoints
│   │   │   ├── settings.js      # Ollama, storage, auth endpoints
│   │   │   └── search.js        # Public reviewer search
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI primitives (Btn, Card, Badge, etc.)
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── QAChat.jsx       # Floating RAG chat widget
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Progress.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── studyFiles/
│   │   │       ├── StudyFiles.jsx
│   │   │       ├── FolderView.jsx
│   │   │       ├── UploadModal.jsx
│   │   │       ├── GenerateModal.jsx
│   │   │       └── outputs/     # Flashcards, MCQ, FIB, ContentViewer (Summary + Reviewer)
│   │   ├── store/
│   │   │   └── useStore.js      # Zustand store — all API-backed state
│   │   ├── data/
│   │   │   └── mockData.js      # UI constants (icons, colors, nav config, local user)
│   │   └── hooks/
│   │       └── useTimer.jsx
│   ├── src-tauri/
│   │   ├── binaries/
│   │   │   └── reviewbot-api-x86_64-pc-windows-msvc.exe   # Pre-built Python sidecar
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   └── lib.rs           # Spawns sidecar on app start
│   │   ├── tauri.conf.json      # Tauri config (devUrl: 1420, sidecar: binaries/reviewbot-api)
│   │   └── Cargo.toml
│   ├── package.json             # npm deps + tauri script
│   ├── vite.config.js           # Port 1420, chrome105 target
│   └── index.html
└── backend/                     # Python FastAPI sidecar source
    ├── main.py                  # FastAPI app, port 8765, CORS for Tauri
    ├── routers/
    │   ├── folders.py           # /folders, /files, /generate pipeline
    │   ├── outputs.py           # /flashcards, /mcqs, /outputs
    │   ├── chat.py              # RAG chat per folder
    │   ├── settings.py          # Ollama status, storage, auth
    │   └── search.py            # Supabase public reviewer search
    ├── services/
    │   ├── parsing_service.py   # PDF, PPTX, CSV, TXT/MD → Markdown
    │   ├── chroma_service.py    # ChromaDB embed + query
    │   ├── ollama_service.py    # Ollama health, RAM detection, generate
    │   ├── generation_service.py # Chunk reviewer, aggregate, FC/MCQ/summary prompts
    │   └── pdf_service.py       # WeasyPrint PDF generation
    ├── database/
    │   ├── schema.sql           # SQLite tables (folders, files, flashcards, mcqs, outputs, chat, settings)
    │   └── init_db.py           # DB init + connection helper
    ├── models/
    │   └── schemas.py           # Pydantic request/response schemas
    ├── requirements.txt
    ├── reviewbot-api.spec       # PyInstaller spec
    └── build_sidecar.bat        # Build binary → copies to frontend/src-tauri/binaries/
```

---

## Tech Stack

### Frontend (actual)
- **Tauri v2** — desktop shell; spawns FastAPI sidecar on launch
- **React 19 + JavaScript (JSX)** — UI framework (not TypeScript)
- **Custom CSS** — all styling via `src/index.css` with CSS custom properties (not Tailwind)
- **Custom UI components** — `src/components/ui/` (not shadcn/ui)
- **Zustand 5** — local state management; all API-backed
- **React Router 7** — tab navigation

### Backend (Python sidecar via Tauri)
- **FastAPI** — local REST API on `127.0.0.1:8765`; started as Tauri sidecar
- **Ollama** (local) — LLM inference
- **ChromaDB** — local vector store for RAG
- **SQLite** — app database at `%APPDATA%\ReviewBot\db\reviewbot.sqlite`
- **psutil** — RAM detection for model recommendation

### File Parsing
- **pdfplumber** — PDF text extraction (page-by-page → Markdown)
- **python-pptx** — PowerPoint extraction (slide-by-slide → Markdown)
- **pandas** — CSV parsing (→ Markdown table)
- **TXT / MD** — direct passthrough

### PDF Generation (outputs)
- **WeasyPrint** — summary PDFs and reviewer PDFs

### Optional Account / Sharing
- **Supabase** (free tier) — auth + public reviewer storage when online
- Falls back gracefully to local-only if no account or no internet

---

## How to Run

### Frontend (Vite dev server only)
```
cd frontend
npm run dev
```
Access at `http://localhost:1420`. Backend must be running separately for API calls to work.

### Backend (standalone for development)
```
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8765 --reload
```

### Full desktop app (Tauri)
```
cd frontend
npm run tauri dev
```
Requires Rust + Cargo installed. Tauri automatically spawns the pre-built `reviewbot-api.exe` sidecar.

### Rebuild the Python sidecar binary
```
cd backend
pip install pyinstaller
build_sidecar.bat
```
Outputs to `frontend/src-tauri/binaries/reviewbot-api-x86_64-pc-windows-msvc.exe`.

---

## AI Configuration

### Ollama Models (auto-recommended on first launch)

| RAM Available | Recommended Model | Size | Notes |
|---|---|---|---|
| Under 8GB | Warn user, manual mode only | — | AI features disabled |
| 8GB | Phi-3 Mini or Llama 3.2 3B | ~2–2.3GB | Decent quality, slower |
| 16GB+ | Llama 3.1 8B | ~5GB | Best quality |

### Document Chunking Strategy

1. Every uploaded file is split into **5-page chunks**
2. Each chunk is sent to Ollama to generate a **chunk-level comprehensive reviewer**
3. All chunk reviewers are **aggregated** into a single **master comprehensive reviewer** per file
4. All other outputs (flashcards, MCQs, summary PDF) are derived from the **master reviewer**, not the raw source text
5. This keeps token usage predictable and consistent regardless of file length

### Token Limits (per LLM call)

| Stage | Context Tokens | Response Tokens | Notes |
|---|---|---|---|
| Chunk → comprehensive reviewer | ~1,500 | 1,200 | Per 5-page chunk |
| Aggregate chunk reviewers → master reviewer | ~3,000 | 2,000 | Combine all chunk outputs |
| Master reviewer → flashcards | ~3,000 | 1,500 | Full card set per file |
| Master reviewer → MCQs | ~3,000 | 1,500 | Full question set per file |
| Master reviewer → summary PDF | ~3,000 | 1,200 | Concise version |
| RAG chat response | 500–800 (2–3 chunks) | 150–200 | Strictly grounded in context |

---

## Features

### 1. File Ingestion Pipeline

- Accepts: `.pdf`, `.pptx`, `.csv`, `.txt`, `.md`
- On upload, file is parsed and converted to internal Markdown representation
- Raw files are NOT stored — only the extracted Markdown is kept
- Markdown split into 5-page chunks, each embedded into ChromaDB for RAG
- Each chunk tagged with source file, folder, and page range metadata

### 2. AI Generation Pipeline (requires Ollama running)

```
Raw File
  → Markdown extraction
  → Split into 5-page chunks
  → Chunk-level comprehensive reviewers (parallel Ollama calls)
  → Aggregated master comprehensive reviewer
  → Flashcards
  → MCQs
  → Summary PDF
  → Comprehensive Reviewer PDF
```

### 3. RAG Chat (per folder)

- User types a question in the floating chat panel
- App queries ChromaDB for top 2–3 relevant chunks
- Chunks + question sent to Ollama with strict token limits
- Model answers ONLY from retrieved context
- Each answer cites which file and page range it came from
- Chat history stored locally per folder session

### 4. Manual Mode (no Ollama required)

- Backend API supports manual flashcard and MCQ creation (is_manual flag)
- Frontend manual creation UI is not yet built

---

## Data Storage (Local)

All local data lives in the user's app data directory (`%APPDATA%\ReviewBot\`).

```
%APPDATA%/ReviewBot/
├── db/
│   └── reviewbot.sqlite        # folders, files, flashcards, mcqs, outputs, chat, settings
├── chroma/                     # vector embeddings per folder
└── outputs/                    # generated PDFs
```

---

## Development Checklist

### Phase 1 — Setup
- [x] Initialize Tauri v2 project with React
- [x] Set up Zustand store and React Router tabs (Dashboard, Study Files, Search, Settings)
- [x] Set up FastAPI Python sidecar in Tauri (port 8765, CORS configured)
- [x] Initialize SQLite database schema
- [x] Light/dark theme toggle *(dark CSS vars, Zustand persist, Settings toggle wired)*

### Phase 2 — File Ingestion
- [x] PDF parsing with pdfplumber → Markdown
- [x] PPTX parsing with python-pptx → Markdown
- [x] CSV parsing with pandas → Markdown table
- [x] TXT / MD passthrough normalization
- [x] 5-page chunk splitter for all file types
- [x] Store extracted Markdown and chunk metadata in SQLite
- [x] Embed chunks into ChromaDB with file + folder + page range tags

### Phase 3 — AI Generation Pipeline
- [x] Ollama integration + health check
- [x] RAM detection → model recommendation
- [x] Chunk → comprehensive reviewer prompt + token limits
- [x] Chunk reviewer aggregation → master reviewer
- [x] Master reviewer → flashcards generation
- [x] Master reviewer → MCQ generation
- [x] Master reviewer → summary PDF generation
- [x] Master reviewer → comprehensive reviewer PDF generation
- [x] Per-file pipeline status tracking (chunking / reviewing / aggregating / done)
- [x] Queue system — FastAPI BackgroundTasks (non-blocking)

### Phase 4 — RAG Chat
- [x] ChromaDB semantic search per folder
- [x] Top 2–3 chunk retrieval pipeline
- [x] Ollama call with context + token limits
- [x] Citation of source file + page range in responses
- [x] Chat UI with history stored per folder session

### Phase 5 — Manual Mode
- [x] Backend API endpoints for manual flashcard CRUD (POST /flashcards, PUT, DELETE)
- [x] Backend API endpoints for manual MCQ CRUD (POST /mcqs, DELETE)
- [x] Manual outputs stored in SQLite (is_manual flag)
- [x] Frontend UI form for manual flashcard creation *(ManualCreateModal with tabbed FC/MCQ)*
- [x] Frontend UI form for manual MCQ creation *(same modal, MCQ tab)*

### Phase 6 — Dashboard / Study Files
- [x] Folder list fetches from real API on app load
- [x] Create / rename / delete folder (wired to API)
- [x] Folder detail view — real source files + generated output cards
- [x] AI generation trigger wired to real API
- [x] File upload UI with real drag-and-drop and API integration
- [x] Disable Generate button when Ollama not detected *(Ollama guard added — checks on modal open)*

### Phase 7 — Search Tab
- [x] Online/offline detection *(navigator.onLine + window events; offline banner shown)*
- [x] Supabase query wired to real API *(searchApi.search() with 400 ms debounce)*
- [x] Download reviewer as PDF to local storage *(ArtifactCard download btn — Tauri dialog.save + browser fallback)*

### Phase 8 — Settings Tab
- [x] Ollama status indicator (running / not detected) + installed model list
- [x] RAM-based model recommendation display
- [x] Supabase account login / register / logout
- [x] Storage usage display (db, outputs, chroma sizes)
- [x] Clear local data
- [x] Theme toggle (light / dark) *(dark CSS vars + Zustand persist + Settings toggle wired)*
- [x] Export all data to file *(GET /settings/export returns JSON; Settings button triggers browser download)*

### Phase 8b — First-Run Setup Wizard
- [x] 4-step wizard: Welcome → Ollama → AI Model → Ready (`frontend/src/pages/Setup.jsx`)
- [x] App.jsx shows wizard on first launch; skips automatically if Ollama + model already present
- [x] Step 0: Welcome / intro screen with skip option
- [x] Step 1: Auto-install Ollama — `POST /settings/ollama/install` downloads `OllamaSetup.exe` (~110 MB) via streaming httpx, runs `/S` silent install, polls `/settings/ollama/install-status/{job_id}` every 1 s; fallback "install manually" link opens ollama.com; wizard auto-advances once Ollama is detected running
- [x] Step 2: Model picker (RAM-aware), `POST /settings/ollama/pull`, polls `/settings/ollama/pull-status/{job_id}` every 1.5 s with progress bar
- [x] Step 3: Done checklist screen
- [x] `setupDismissed` persisted in Zustand localStorage — wizard never re-shown

#### Setup Wizard — New API Endpoints (backend/routers/settings.py)
| Method | Path | Description |
|---|---|---|
| `POST` | `/settings/ollama/install` | Start background installer job → `{job_id}` |
| `GET` | `/settings/ollama/install-status/{job_id}` | Poll → `{status, progress, error}` |

Install job `status` flow: `downloading` (0–88%) → `installing` (90%) → `done` (100%) \| `error`

#### Export Formats (backend/routers/outputs.py + backend/services/docx_service.py)
- `GET /outputs/{id}/export/docx` — Summary or Reviewer as DOCX (uses stored `content_markdown`)
- `GET /folders/{id}/flashcards/export/docx` — All flashcards as DOCX
- `GET /folders/{id}/mcqs/export/docx` — All MCQs as DOCX
- `GET /folders/{id}/mcqs/export/csv` — All MCQs as CSV
- Content stored in `outputs.content_markdown` (added via `ALTER TABLE` migration in `init_db.py`)

### Phase 11 — Gamification
- [x] 100-level system with tier titles every 10 levels (Novice → Luminary)
- [x] Seniority prefixes at levels 3, 6, 9 within each tier (Junior / Senior / Elite)
- [x] Global XP: +1 per 5 terms mastered, +5 at 95% folder mastery, +10 at 100%
- [x] Level-up logic with scaling XP thresholds (100 + (level-1)×50)
- [x] XP + level persisted via Zustand persist middleware (localStorage)
- [x] Local folder mastery progress bar (combined FC + MCQ %)
- [x] Mastery visible on Dashboard folder cards, Progress page, and Sidebar user section
- [x] "Know it" flashcard button wired to markCardMastered
- [x] MCQ correct answers wired to markMCQResult
- [x] QAChat: AI disclaimer, per-file source selector, soft limit (10 msg), hard limit (20 msg)
- [x] QAChat file_ids filter flows through backend (ChromaDB where clause)

### Phase 9 — Public Sharing
- [x] Supabase auth integration (login / register / logout)
- [x] Publish reviewer to Supabase (`POST /folders/{id}/publish` → stores supabase_id)
- [x] Unpublish / delete from Supabase (`DELETE /folders/{id}/publish`)
- [x] Search returns public reviewers; Download button saves `.md` to disk
- [x] `make_public` + `download_reviewer` achievements wired

### Phase 10 — Distribution
- [x] Configure `tauri build` for Windows (NSIS + installer, externalBin sidecar)
- [x] PyInstaller spec + build_sidecar.bat for sidecar binary
- [x] GitHub Actions release workflow *(.github/workflows/release.yml — triggers on v* tags)*
- [ ] Test installer on clean Windows 10 machine
- [ ] Write README with install instructions + Ollama setup guide
- [ ] Tag release and publish to GitHub Releases

---

## Remaining Work (Priority Order)

1. ~~**Search tab**~~ ✓ Done
2. ~~**Theme toggle**~~ ✓ Done
3. ~~**Generate guard**~~ ✓ Done
4. ~~**Manual creation UI**~~ ✓ Done
5. ~~**Public sharing (privacy toggle)**~~ ✓ Done
6. ~~**Download to disk**~~ ✓ Done
7. ~~**GitHub Actions**~~ ✓ Done
8. ~~**Export data**~~ ✓ Done
9. ~~**Setup wizard (auto-install Ollama)**~~ ✓ Done
10. ~~**DOCX / CSV export**~~ ✓ Done
11. ~~**Publish to Supabase**~~ ✓ Done — POST/DELETE /folders/{id}/publish; FolderView Publish button (requires sign-in)
12. ~~**User profile persistence**~~ ✓ Done — name/avatar stored in SQLite app_settings; loaded on startup
13. ~~**Daily streak tracking**~~ ✓ Done — POST /settings/checkin; streak shown in Profile + Progress
14. ~~**Generation status polling**~~ ✓ Done — StudyFiles polls every 2 s during active generation
15. ~~**Real content in all viewers**~~ ✓ Done — ContentViewer for Summary/Reviewer; FIB empty state
16. **README** — install + Ollama setup guide
17. **Test installer** — verify on clean Windows 10

## New API Endpoints Added

| Method | Path | Description |
|---|---|---|
| `PUT` | `/settings/profile` | Save `user_name`, `user_avatar` to app_settings |
| `POST` | `/settings/checkin` | Daily streak checkin → `{streak, date}` |
| `POST` | `/folders/{id}/publish` | Publish reviewer to Supabase public_reviewers table |
| `DELETE` | `/folders/{id}/publish` | Unpublish + set privacy=private |
| `GET` | `/outputs/{id}/content` | Return `content_markdown` for Summary/Reviewer |
| `PUT` | `/files/{id}/title` | Save AI-generated or user-edited title |

## Supabase Table Required for Publishing

```sql
CREATE TABLE public_reviewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  folder_name text NOT NULL,
  content_markdown text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public_reviewers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read" ON public_reviewers FOR SELECT USING (true);
CREATE POLICY "Owner can insert" ON public_reviewers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can delete" ON public_reviewers FOR DELETE USING (auth.uid() = user_id);
```

---

## Out of Scope for v1

- macOS / Linux support
- Multi-language UI or AI outputs
- Mobile companion app
- Real-time collaboration
- Teacher / classroom management features
- Custom model fine-tuning
- Audio or video file ingestion

---

## Post-v1 Phased Roadmap

> **How to resume a session:** Tell Claude "continue developing according to CLAUDE.md" and point to the first unchecked item in the current phase below.

---

### Phase 12 — UX Polish & Bug Fixes *(current)*

Discovered during first real user test session. All items are frontend unless noted.

- [x] Remove topbar search bar (duplicate of the Search tab — confusing)
- [x] Fix "Pending" file status label → "Ready to generate"; "Error" → "Output failed" in `FolderView` `STATUS_LABEL`
- [x] Remove redundant Privacy toggle from FolderView — Publish button is now the sole public/private control
- [x] Fix Dashboard folder cards + Sidebar folder links to open that specific folder immediately
  - `pendingFolderOpen` added to Zustand store
  - Dashboard/Sidebar sets it + navigates to `/studyfiles`
  - StudyFiles reads it on mount, auto-opens folder, clears the flag
- [x] Fix auth: backend detects "email confirmation pending" (no access_token in signup response) and returns HTTP 403 with "Check your email for a confirmation link"
  - ⚠️ Supabase → Auth → Providers → Email → disable "Confirm email" is the easiest fix for dev; the backend message handles prod gracefully
- [x] Improve generation error display: stage-based progress bar (10%→20%→45%→65%→80%→100%), "Output failed" label, error message shown under file row with full text on hover

---

### Phase 13 — GenerateModal Overhaul

The current GenerateModal has a misleading "output type" selector (all types are always generated) and no file selection. This phase replaces it.

- [x] **File selection checkboxes** — user picks which uploaded files to include; "Select all" toggle at top; done/error files shown as read-only
- [x] **Remove output-type tab UI** — replaced with per-type count controls:
  - Flashcards: number input, default 10, max 50, "Max (50)" checkbox
  - MCQs: number input, default 10, max 50, "Max (50)" checkbox
  - Fill-in-blanks: number input, default 5, max 20, "Max (20)" checkbox
  - Summary PDF: "Extract keywords" toggle (adds Keyword Glossary section)
- [x] **Estimated time display** — `~{n×3}–{n×7} min` based on selected file count; laptop warning shown
- [x] **Backend**: `POST /folders/{id}/generate` accepts `{ file_ids, options: { flashcard_count, mcq_count, fib_count, summary_keywords } }`
- [x] **Backend**: `generation_service.py` prompts use `{count}` param
- [x] **API + Store**: `foldersApi.generate(folderId, fileIds, options)` and `triggerGenerate(folderId, fileIds, options)`
- [x] **Delete folder with typed-name confirmation** — red "Delete" button in FolderView header; confirmation panel with input (must type exact folder name); deletes all files, outputs, flashcards, embeddings

#### New backend behaviour
| Param | Default | Notes |
|---|---|---|
| `file_ids` | all pending files | array of file IDs to include |
| `flashcard_count` | 15 | 1–50 |
| `mcq_count` | 10 | 1–50 |
| `fib_count` | 7 | 1–20 |
| `summary_keywords` | true | appends keyword glossary to summary |

---

### Phase 14 — Generation Progress & Cancel

- [x] **Stage-based progress bar**: `parsing=10%`, `chunking=20%`, `reviewing=45%`, `aggregating=65%`, `generating=80%`; smooth 0.6s CSS transition
- [x] **Spinner animation** (CSS `spin` keyframe, `.row-spinner`) on each active source file row
- [x] **"Output failed"** label + truncated `error_message` with full text on hover
- [x] **Active generation banner** (`.gen-active-banner`) with spinner, file count, and estimated time remaining
- [x] **Cancel generation**: `POST /files/{id}/cancel` → `status='cancelled'`; pipeline checks `_is_cancelled()` between every stage; X button on active rows
- [x] **Backend schema migration**: `init_db.py` auto-recreates `files` table to add `'cancelled'` to CHECK constraint on existing DBs

---

### Phase 15 — Critical Bug Fixes & DB Stability

- [x] **SQLite FK cascade fix** — `file_id` changed from `ON DELETE CASCADE` → `ON DELETE SET NULL` on flashcards, mcqs, fibs, outputs; deleting a source file no longer wipes generated outputs
- [x] **DB FK migration** — `init_db.py` auto-detects and repairs tables whose `file_id` still references `files_old` (leftover from a partial migration) or uses `ON DELETE CASCADE` for `file_id`; runs on every startup
- [x] **asyncio.gather removed from pipeline** — all 4 generation calls (flashcards → MCQ → summary → FIB) now run sequentially; fixes MCQ/FIB silently timing out because Ollama is single-threaded locally
- [x] **Generation batching** — large counts (e.g. Max=50) are split into safe per-call batches (15 FC / 10 MCQ / 7 FIB) with front-text deduplication; prevents JSON truncation on token limit
- [x] **fpdf2 v2.8 cursor fix** — `multi_cell` now passes `new_x="LMARGIN", new_y="NEXT"` everywhere; fixes "Not enough horizontal space" crash in PDF generation
- [x] **MCQ component crash fixed** — options from API are `{label, text}` objects; component now extracts `opt.text` with string fallback
- [x] **Timezone fix** — `relativeTime()` now appends `Z` before parsing SQLite's UTC timestamp strings so "8 hours ago" no longer appears for just-created items
- [x] **Supabase JWT expired** — detected in publish flow; session cleared and "log in again" toast shown
- [x] **DONE is not defined** crash in GenerateModal — removed leftover `DONE.includes` reference after allow-all-files refactor
- [x] **FIB save condition** — backend pipeline now accepts FIBs where only `after_blank` is set (either side + answer required, matching frontend)
- [x] **Chat formatting** — RAG prompt updated to request bullet points, bold key terms, short responses with source citation

---

### Phase 16 — Card List View & Quiz UX Overhaul

**Output card click flow changed:** Flashcard/MCQ/FIB cards now open a *list view* (manage mode) instead of the quiz directly. "Study / Take Quiz / Take Exercise" button in the list header launches the quiz.

- [x] **FlashcardList.jsx** — scrollable list with inline editable front/back fields; autosave on blur (PUT /flashcards/{id}); per-card delete; "Add N empty cards" with count input; "Study Flashcards →" button
- [x] **MCQList.jsx** — same pattern; editable question + 4 options + correct-answer selector + explanation; "Take Quiz →" button
- [x] **FIBList.jsx** — same pattern; editable before/answer/after/hint; "Take Exercise →" button
- [x] **MCQ quiz overhaul** — timer removed; click an option = instant submit (no separate Submit button); answer history persists when navigating back (can't re-answer); score popup overlay at end ("See results →" on last question)
- [x] **FIB exercise overhaul** — same score popup; "See results →" on last question instead of disabled Next
- [x] **ManualCreateModal rewrite** — 3 tabs (Flashcard / MCQ / FIB); starts with 5 empty cards per tab; same inline-edit + autosave + add-N pattern as list views; "Cancel" + "Done — save to folder" footer
- [x] **Output card triple-dot menu (⋯)** — Delete option removes all items of that type for the folder via bulk-delete endpoints
- [x] **Done files selectable in GenerateModal** — re-generating resets status to pending and re-runs pipeline; shows "Done — re-generate?" label
- [x] **FIB `before_blank` optional** — either side (before OR after) + answer is sufficient, in both frontend and backend

#### New API endpoints (Phase 16)

| Method | Path | Description |
|---|---|---|
| `PUT` | `/mcqs/{id}` | Update question, options, correct answer, explanation |
| `PUT` | `/fibs/{id}` | Update before_blank, answer, after_blank, hint |
| `DELETE` | `/folders/{id}/flashcards/all` | Delete all flashcards for a folder |
| `DELETE` | `/folders/{id}/mcqs/all` | Delete all MCQs for a folder |
| `DELETE` | `/folders/{id}/fibs/all` | Delete all FIBs for a folder |
| `DELETE` | `/outputs/{id}` | Delete a specific Summary or Reviewer output |

---

### Phase 17 — UI Polish & App Identity

- [x] **ReviewBot logo** — open-book SVG with page lines and 4-point AI sparkle, indigo→violet gradient (`frontend/src/components/ui/ReviewBotLogo.jsx`); used in sidebar and as favicon
- [x] **Browser tab** — favicon and `<title>` updated to "ReviewBot"
- [x] **Sidebar cleanup** — MY FILES folder-tree section removed; logo now shows real ReviewBot SVG + "ReviewBot / AI Study Assistant" text
- [x] **Topbar cleanup** — notifications bell removed; only avatar (click → Settings) remains
- [x] **Dark mode topbar** — was hardcoded `rgba(250,248,253,.94)`; now properly overridden to dark in `[data-theme="dark"]`
- [x] **Modal padding** — `modal-footer-row` now has 24px bottom padding; modal list scroll has horizontal padding so buttons/items don't hug edges; "Close" renamed "Cancel" in ManualCreateModal
- [x] **Quiz score popup** — `.quiz-done-overlay` full-screen backdrop with centered `.quiz-done-modal`; contextual emoji, score fraction, encouragement message, "Back to Folder/List" button

---

### Phase 18 — Distribution (v1 Release)

- [x] Write README — install guide + Ollama setup + screenshots
- [ ] Test installer on a clean Windows 10 machine
- [ ] Tag `v1.0.0` release on GitHub → GitHub Actions builds the installer automatically
