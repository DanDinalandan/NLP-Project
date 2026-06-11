PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    privacy TEXT NOT NULL DEFAULT 'private' CHECK(privacy IN ('private','public')),
    supabase_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    markdown_content TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','parsing','chunking','reviewing','aggregating','generating','done','error')),
    chunk_count INTEGER NOT NULL DEFAULT 0,
    master_reviewer TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    is_manual INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mcqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL DEFAULT '',
    is_manual INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    output_type TEXT NOT NULL
        CHECK(output_type IN ('summary_pdf','reviewer_pdf','flashcards','mcqs')),
    file_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user','assistant')),
    content TEXT NOT NULL,
    citations TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings(key, value) VALUES ('theme', 'light');
INSERT OR IGNORE INTO app_settings(key, value) VALUES ('selected_model', '');
INSERT OR IGNORE INTO app_settings(key, value) VALUES ('supabase_token', '');
INSERT OR IGNORE INTO app_settings(key, value) VALUES ('supabase_user_id', '');
INSERT OR IGNORE INTO app_settings(key, value) VALUES ('supabase_email', '');

CREATE TRIGGER IF NOT EXISTS folders_updated_at
AFTER UPDATE ON folders FOR EACH ROW
BEGIN
    UPDATE folders SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS files_updated_at
AFTER UPDATE ON files FOR EACH ROW
BEGIN
    UPDATE files SET updated_at = datetime('now') WHERE id = OLD.id;
END;
