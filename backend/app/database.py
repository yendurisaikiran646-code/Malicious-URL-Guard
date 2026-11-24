"""
Privacy-conscious SQLite database module for scan history.
Strictly strips query parameters, userinfo, and auth tokens before persistence.
"""

import sqlite3
import re
from urllib.parse import urlparse
from typing import List, Dict, Any
from datetime import datetime
from .config import DB_PATH


def sanitize_url_for_storage(raw_url: str) -> str:
    """
    Sanitize URL to preserve privacy.
    Strips credentials, query strings (tokens, ids, keys), and fragment identifiers.
    Keeps only scheme, hostname, and path structure.
    """
    if not raw_url:
        return ""
    url = raw_url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        url = f"http://{url}"

    try:
        parsed = urlparse(url)
        # Reconstruct without query, fragment, or user:pass
        hostname = parsed.hostname or ""
        port_part = f":{parsed.port}" if parsed.port and parsed.port not in (80, 443) else ""
        path = parsed.path if parsed.path else "/"
        return f"{parsed.scheme}://{hostname}{port_part}{path}"
    except Exception:
        # Fallback: remove everything after '?' or '#'
        safe = re.split(r"[?#]", raw_url)[0]
        return safe[:255]


def get_db_connection() -> sqlite3.Connection:
    """Create and return a SQLite connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables with schema migrations if needed."""
    with get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scan_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sanitized_url TEXT NOT NULL,
                verdict TEXT NOT NULL,
                probability REAL NOT NULL,
                timestamp TEXT NOT NULL
            )
            """
        )
        conn.commit()


def record_scan(raw_url: str, verdict: str, probability: float) -> int:
    """Record a sanitized scan entry."""
    sanitized = sanitize_url_for_storage(raw_url)
    timestamp = datetime.now().isoformat()
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO scan_history (sanitized_url, verdict, probability, timestamp)
            VALUES (?, ?, ?, ?)
            """,
            (sanitized, verdict, round(probability, 4), timestamp),
        )
        conn.commit()
        return cursor.lastrowid


def get_history(limit: int = 50) -> Dict[str, Any]:
    """Retrieve aggregate statistics and recent sanitized scans."""
    init_db()
    with get_db_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM scan_history").fetchone()[0]
        benign = conn.execute("SELECT COUNT(*) FROM scan_history WHERE verdict = 'benign'").fetchone()[0]
        malicious = conn.execute("SELECT COUNT(*) FROM scan_history WHERE verdict = 'potentially_malicious'").fetchone()[0]
        uncertain = conn.execute("SELECT COUNT(*) FROM scan_history WHERE verdict = 'uncertain'").fetchone()[0]

        rows = conn.execute(
            """
            SELECT id, sanitized_url, verdict, probability, timestamp
            FROM scan_history
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        recent = [
            {
                "id": row["id"],
                "sanitized_url": row["sanitized_url"],
                "verdict": row["verdict"],
                "probability": row["probability"],
                "timestamp": row["timestamp"],
            }
            for row in rows
        ]

    return {
        "total_scans": total,
        "benign_count": benign,
        "malicious_count": malicious,
        "uncertain_count": uncertain,
        "recent_scans": recent,
    }


def clear_all_history():
    """Clear all records from scan history."""
    init_db()
    with get_db_connection() as conn:
        conn.execute("DELETE FROM scan_history")
        conn.commit()
