"""Shared SQLite access: connection, schema, and per-user credential storage.

Centralizing DB_PATH here ensures every module (server, agent tools) reads and
writes the same database file, whether running locally or on the persistent
volume in production.
"""
import os
import sqlite3
import time
from pathlib import Path
from cryptography.fernet import Fernet

_BASE_DIR = Path(__file__).parent.parent
_DATA_DIR = Path('/data') if Path('/data').exists() else _BASE_DIR
DB_PATH = _DATA_DIR / 'chats.db'


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL DEFAULT '',
                picture TEXT NOT NULL DEFAULT '',
                credentials TEXT NOT NULL,
                created_at REAL NOT NULL DEFAULT (unixepoch('now')),
                last_login REAL NOT NULL DEFAULT (unixepoch('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT '',
                title TEXT NOT NULL,
                messages TEXT NOT NULL DEFAULT '[]',
                thread_id TEXT NOT NULL,
                created_at REAL NOT NULL DEFAULT (unixepoch('now'))
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id)")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT '',
                name TEXT NOT NULL,
                subject TEXT NOT NULL DEFAULT '',
                body TEXT NOT NULL DEFAULT '',
                created_at REAL NOT NULL DEFAULT (unixepoch('now'))
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id)")


# ── Credential encryption ──────────────────────────────────────────────────
# OAuth tokens are encrypted at rest so a leaked database file alone does not
# grant access to users' Gmail accounts.

def _fernet() -> Fernet:
    key = os.getenv('FERNET_KEY')
    if not key:
        raise RuntimeError(
            'FERNET_KEY env var must be set to store OAuth credentials. '
            'Generate one with: '
            'python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
        )
    return Fernet(key.encode())


def encrypt_credentials(creds_json: str) -> str:
    return _fernet().encrypt(creds_json.encode()).decode()


def decrypt_credentials(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


# ── User CRUD ────────────────────────────────────────────────────────────────

def upsert_user(user_id: str, email: str, name: str, picture: str, credentials_json: str) -> None:
    """Create or update a user record, storing their encrypted OAuth credentials."""
    encrypted = encrypt_credentials(credentials_json)
    now = time.time()
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO users (id, email, name, picture, credentials, created_at, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                email = excluded.email,
                name = excluded.name,
                picture = excluded.picture,
                credentials = excluded.credentials,
                last_login = excluded.last_login
        """, (user_id, email, name, picture, encrypted, now, now))


def get_user(user_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def get_user_credentials(user_id: str) -> str | None:
    user = get_user(user_id)
    if not user:
        return None
    return decrypt_credentials(user['credentials'])


def save_user_credentials(user_id: str, credentials_json: str) -> None:
    encrypted = encrypt_credentials(credentials_json)
    with get_connection() as conn:
        conn.execute("UPDATE users SET credentials = ? WHERE id = ?", (encrypted, user_id))


def list_users() -> list[dict]:
    """Return public profile info for every connected user (no credentials)."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, email, name, picture, created_at, last_login FROM users ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]
