# ReviewBot

An offline-first, AI-powered desktop study app for Windows. Upload your notes, slides, and documents — ReviewBot converts them into flashcards, multiple-choice quizzes, fill-in-the-blank exercises, and summary PDFs. A built-in RAG chat lets you ask questions grounded in your own materials.

---

## Features

- **AI generation** — flashcards, MCQs, fill-in-blanks, and summary PDFs from PDF, PPTX, CSV, TXT, and MD files
- **RAG chat** — ask questions about your uploaded materials; answers cite the exact file and page range
- **Manual creation** — add flashcards and MCQs by hand, no AI needed
- **Gamification** — XP, 100 levels with titles, 20 achievements, per-folder mastery bars
- **Public sharing** — optional Supabase account to publish and search community reviewers
- **Fully offline** — everything runs locally; internet only needed for the optional sharing features
- **Dark mode** — toggle in Settings

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 64-bit | Windows 11 |
| RAM | 8 GB | 16 GB |
| Storage | 8 GB free | 12 GB+ free |
| CPU | Any modern x64 | — |
| GPU | Not required | NVIDIA (CUDA) speeds up inference |
| Internet | Not required | Needed for public sharing only |

---

## Installation

### Step 1 — Install ReviewBot

1. Go to the [Releases](../../releases) page
2. Download the latest `ReviewBot_x.x.x_x64-setup.exe`
3. Run the installer — no admin rights required
4. Launch **ReviewBot** from the Start menu or desktop shortcut

### Step 2 — Install Ollama

ReviewBot uses [Ollama](https://ollama.com) to run the AI locally. Without it the app works in manual mode only.

1. Download the Ollama installer from **[ollama.com](https://ollama.com)**
2. Run the installer — Ollama runs as a background service automatically
3. Open a terminal and pull a model (see the table below)

#### Which model should I pull?

Open **Command Prompt** or **PowerShell** and run one of these:

| Your RAM | Command | Model size | Notes |
|----------|---------|-----------|-------|
| 8 GB | `ollama pull llama3.2:3b` | ~2 GB | Good quality, fast |
| 16 GB+ | `ollama pull llama3.1:8b` | ~5 GB | Best quality |
| Under 8 GB | — | — | Use manual mode; AI features disabled |

Verify Ollama is running:
```
ollama list
```
You should see the model you just pulled. ReviewBot auto-detects it on launch.

---

## First Launch

1. Open ReviewBot
2. Go to **Settings** — confirm the green "Ollama running" status
3. Go to **Study Files → New folder**
4. Upload a PDF, PPTX, TXT, or CSV
5. Click **Generate** — outputs appear within a few minutes depending on file size and model
6. Open **Flashcards**, **MCQ**, or **Summary PDF** to start studying

---

## Optional — Online Account (Public Sharing)

Create a free account to publish your reviewers publicly and search the community library.

1. Go to **Settings → Online Account**
2. Enter any email and password — the app registers you automatically on first sign-in
3. In a folder, toggle the privacy button from **Private** to **Public**, then click **Publish**

No personal data is required. The account only stores your published reviewers.

---

## Uninstall

Go to **Settings → Apps → ReviewBot → Uninstall**.

Local study data is stored in `%APPDATA%\ReviewBot\`. Delete this folder manually after uninstalling to remove all data.

---

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Rust](https://rustup.rs) (stable)
- [Python](https://python.org) 3.11+
- [Ollama](https://ollama.com) (for AI features)

### Run in development mode

```bash
# 1. Start the Python backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8765 --reload

# 2. Start the frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:1420` in your browser. The backend must be running for API calls to work.

### Run the full Tauri desktop app

```bash
cd frontend
npm run tauri dev
```

Requires Rust + Cargo. Tauri spawns the pre-built `reviewbot-api.exe` sidecar automatically.

### Rebuild the Python sidecar

```bash
cd backend
pip install pyinstaller
build_sidecar.bat
```

Output: `frontend/src-tauri/binaries/reviewbot-api-x86_64-pc-windows-msvc.exe`

### Build the release installer

```bash
cd frontend
npm run tauri build
```

Installer output: `frontend/src-tauri/target/release/bundle/nsis/`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 (Rust) |
| Frontend | React 19 + JavaScript + Custom CSS |
| State | Zustand 5 |
| Routing | React Router 7 |
| Backend | Python + FastAPI (port 8765, Tauri sidecar) |
| AI inference | Ollama (local LLMs) |
| Vector store | ChromaDB (local embeddings) |
| Database | SQLite (`%APPDATA%\ReviewBot\db\reviewbot.sqlite`) |
| PDF generation | WeasyPrint |
| File parsing | pdfplumber, python-pptx, pandas |
| Optional cloud | Supabase (auth + public reviewer storage) |

---

## Data & Privacy

All study data stays on your machine. Nothing is sent to any server unless you explicitly publish a reviewer using an online account. Even then, only the reviewer content you choose to share is uploaded — never your source files.

---

## License

MIT
