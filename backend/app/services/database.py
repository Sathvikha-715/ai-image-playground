import os
import sqlite3
from contextlib import closing
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "history.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(get_conn()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS generations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt TEXT NOT NULL,
                negative_prompt TEXT,
                steps INTEGER,
                guidance_scale REAL,
                seed INTEGER,
                width INTEGER,
                height INTEGER,
                generation_time_s REAL,
                image_path TEXT,
                created_at TEXT
            )
            """
        )
        conn.commit()


def save_generation(prompt, negative_prompt, steps, guidance_scale, seed,
                    width, height, generation_time_s, image_path):
    with closing(get_conn()) as conn:
        cur = conn.execute(
            """
            INSERT INTO generations
            (prompt, negative_prompt, steps, guidance_scale, seed, width, height,
             generation_time_s, image_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (prompt, negative_prompt, steps, guidance_scale, seed, width, height,
             generation_time_s, image_path, datetime.now().isoformat(timespec="seconds")),
        )
        conn.commit()
        return cur.lastrowid


def list_generations(limit=50):
    with closing(get_conn()) as conn:
        rows = conn.execute(
            "SELECT * FROM generations ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


def get_generation(gen_id):
    with closing(get_conn()) as conn:
        row = conn.execute(
            "SELECT * FROM generations WHERE id = ?", (gen_id,)
        ).fetchone()
        return dict(row) if row else None


def delete_generation(gen_id):
    with closing(get_conn()) as conn:
        conn.execute("DELETE FROM generations WHERE id = ?", (gen_id,))
        conn.commit()