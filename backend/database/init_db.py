import sqlite3
import os
from pathlib import Path


def get_db_path() -> Path:
    app_data = os.environ.get("APPDATA", str(Path.home()))
    db_dir = Path(app_data) / "ReviewBot" / "db"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "ReviewBot.sqlite"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(get_db_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    schema_path = Path(__file__).parent / "schema.sql"
    conn = get_connection()

    # Recovery: clean up stale triggers, tables, and broken FK references from a failed migration
    try:
        conn.execute("PRAGMA foreign_keys=OFF")

        # 1. Drop triggers referencing files_old
        stale_triggers = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='trigger' AND sql LIKE '%files_old%'"
        ).fetchall()
        for (tname,) in stale_triggers:
            conn.execute(f'DROP TRIGGER IF EXISTS "{tname}"')

        # 2. Drop leftover files_old table
        has_old   = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='files_old'").fetchone()
        has_files = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='files'").fetchone()
        if has_old and has_files:
            conn.execute("DROP TABLE files_old")
        elif has_old and not has_files:
            conn.execute("ALTER TABLE files_old RENAME TO files")

        # 3. Fix child tables: files_old FK reference AND wrong ON DELETE CASCADE for file_id
        tables_to_fix = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND ("
            "  sql LIKE '%files_old%' OR"
            "  sql LIKE '%file_id INTEGER REFERENCES files(id) ON DELETE CASCADE%'"
            ")"
        ).fetchall()
        for (tname,) in tables_to_fix:
            old_sql = conn.execute(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (tname,)
            ).fetchone()[0]
            fixed_sql = (old_sql
                .replace('"files_old"', 'files')
                .replace('REFERENCES files(id) ON DELETE CASCADE',
                         'REFERENCES files(id) ON DELETE SET NULL'))
            tmp = tname + "_fixed"
            # sqlite_master may store name quoted or unquoted — handle both
            fixed_sql = (fixed_sql
                .replace(f'TABLE "{tname}"', f'TABLE "{tmp}"', 1)
                .replace(f'TABLE {tname}', f'TABLE {tmp}', 1))
            conn.execute(fixed_sql)
            conn.execute(f'INSERT INTO "{tmp}" SELECT * FROM "{tname}"')
            conn.execute(f'DROP TABLE "{tname}"')
            conn.execute(f'ALTER TABLE "{tmp}" RENAME TO "{tname}"')

        conn.commit()
        conn.execute("PRAGMA foreign_keys=ON")
    except Exception:
        conn.execute("PRAGMA foreign_keys=ON")

    with open(schema_path, "r") as f:
        conn.executescript(f.read())
    conn.commit()
    # Safe migrations for existing databases
    for sql in [
        "ALTER TABLE outputs ADD COLUMN content_markdown TEXT",
        "ALTER TABLE files ADD COLUMN generated_title TEXT",
        (
            "CREATE TABLE IF NOT EXISTS fibs ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,"
            "file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,"
            "before_blank TEXT NOT NULL,"
            "after_blank TEXT NOT NULL DEFAULT '',"
            "answer TEXT NOT NULL,"
            "hint TEXT NOT NULL DEFAULT '',"
            "is_manual INTEGER NOT NULL DEFAULT 0,"
            "created_at TEXT NOT NULL DEFAULT (datetime('now')))"
        ),
    ]:
        try:
            conn.execute(sql)
            conn.commit()
        except Exception:
            pass
    conn.close()
