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
    with open(schema_path, "r") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
