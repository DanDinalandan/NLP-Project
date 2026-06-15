"""
DB recovery script — fixes broken FK references left by a failed files table migration.
Run from the backend directory:
    python fix_db.py
"""
import sqlite3
import os
from pathlib import Path

app_data = os.environ.get("APPDATA", str(Path.home()))
db_path = Path(app_data) / "ReviewBot" / "db" / "ReviewBot.sqlite"

if not db_path.exists():
    print(f"Database not found at {db_path} — nothing to fix.")
    exit(0)

conn = sqlite3.connect(str(db_path))
conn.execute("PRAGMA foreign_keys=OFF")

# ── 1. Drop stale triggers referencing files_old ─────────────────────────────
stale_triggers = conn.execute(
    "SELECT name FROM sqlite_master WHERE type='trigger' AND sql LIKE '%files_old%'"
).fetchall()
if stale_triggers:
    for (tname,) in stale_triggers:
        conn.execute(f'DROP TRIGGER IF EXISTS "{tname}"')
    conn.commit()
    print(f"Dropped {len(stale_triggers)} stale trigger(s) referencing files_old.")
else:
    print("No stale triggers found.")

# ── 2. Drop leftover files_old table ─────────────────────────────────────────
has_old   = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='files_old'").fetchone()
has_files = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='files'").fetchone()
if has_old and has_files:
    conn.execute("DROP TABLE files_old")
    conn.commit()
    print("Dropped leftover files_old table.")
elif has_old and not has_files:
    conn.execute("ALTER TABLE files_old RENAME TO files")
    conn.commit()
    print("Renamed files_old → files.")
else:
    print("No files_old table found.")

# ── 3. Fix child tables whose FK still points to "files_old" ─────────────────
broken = conn.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND sql LIKE '%files_old%'"
).fetchall()

if not broken:
    print("No tables with broken FK references — database is clean.")
else:
    for (tname,) in broken:
        old_sql = conn.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (tname,)
        ).fetchone()[0]
        # Replace the broken FK reference in-place
        fixed_sql = old_sql.replace('"files_old"', 'files')
        tmp = tname + "_fixed"
        # Create fixed copy
        conn.execute(fixed_sql.replace(f"TABLE {tname}", f"TABLE {tmp}", 1))
        # Copy all rows
        conn.execute(f'INSERT INTO "{tmp}" SELECT * FROM "{tname}"')
        # Swap
        conn.execute(f'DROP TABLE "{tname}"')
        conn.execute(f'ALTER TABLE "{tmp}" RENAME TO "{tname}"')
        print(f"Fixed FK in table: {tname}")
    conn.commit()

conn.execute("PRAGMA foreign_keys=ON")
conn.close()
print("Done.")
