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
│   │   │       └── outputs/     # Flashcards, MCQ, FIB, SummaryPDF viewers
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
- [ ] Publish folder outputs to Supabase
- [x] Toggle folder between private and public *(Privacy button in FolderView header — wired to DB)*
- [ ] Unpublish / delete from Supabase

### Phase 10 — Distribution
- [x] Configure `tauri build` for Windows (NSIS + installer, externalBin sidecar)
- [x] PyInstaller spec + build_sidecar.bat for sidecar binary
- [x] GitHub Actions release workflow *(.github/workflows/release.yml — triggers on v* tags)*
- [ ] Test installer on clean Windows 10 machine
- [ ] Write README with install instructions + Ollama setup guide
- [ ] Tag release and publish to GitHub Releases

---

## Remaining Work (Priority Order)

1. ~~**Search tab**~~ ✓ Done — wired to real API with online/offline detection
2. ~~**Theme toggle**~~ ✓ Done — dark CSS vars, Zustand persist, Settings toggle
3. ~~**Generate guard**~~ ✓ Done — Ollama status checked on GenerateModal open
4. ~~**Manual creation UI**~~ ✓ Done — ManualCreateModal with Flashcard + MCQ tabs
5. ~~**Public sharing (privacy toggle)**~~ ✓ Done — FolderView header button wired to DB
6. ~~**Download to disk**~~ ✓ Done — ArtifactCard download via Tauri dialog + browser fallback
7. ~~**GitHub Actions**~~ ✓ Done — `.github/workflows/release.yml` triggers on v* tags
8. ~~**Export data**~~ ✓ Done — GET /settings/export + Settings download button
9. **Publish to Supabase** — publish/unpublish folder outputs (requires online account)
10. **README** — install instructions + Ollama setup guide
11. **Test installer** — verify on clean Windows 10

---

## Out of Scope for v1

- macOS / Linux support
- Multi-language UI or AI outputs
- Mobile companion app
- Real-time collaboration
- Teacher / classroom management features
- Custom model fine-tuning
- Audio or video file ingestion
