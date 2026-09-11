from __future__ import annotations

from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "legalflow_demo.db"


def get_db() -> sqlite3.Connection:
    """Returns a SQLite connection with dict row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def rows(query: str, params=()) -> list[dict]:
    """Helper to execute a query and return all matching rows as dictionaries."""
    with get_db() as conn:
        return [dict(r) for r in conn.execute(query, params).fetchall()]


def one(query: str, params=()) -> dict | None:
    """Helper to execute a query and return a single row as a dictionary."""
    with get_db() as conn:
        r = conn.execute(query, params).fetchone()
        return dict(r) if r else None


def init_db() -> None:
    """Initializes SQLite tables and seeds initial demonstration data if empty."""
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS cases (
              id INTEGER PRIMARY KEY,
              case_code TEXT UNIQUE NOT NULL,
              title TEXT NOT NULL,
              category TEXT NOT NULL,
              status TEXT NOT NULL,
              next_hearing TEXT,
              owner TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
              id INTEGER PRIMARY KEY,
              case_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              assignee TEXT NOT NULL,
              due_date TEXT,
              status TEXT NOT NULL,
              priority TEXT NOT NULL,
              FOREIGN KEY(case_id) REFERENCES cases(id)
            );

            CREATE TABLE IF NOT EXISTS documents (
              id INTEGER PRIMARY KEY,
              case_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              doc_type TEXT NOT NULL,
              content TEXT NOT NULL,
              uploaded_at TEXT NOT NULL,
              FOREIGN KEY(case_id) REFERENCES cases(id)
            );

            CREATE TABLE IF NOT EXISTS drafts (
              id INTEGER PRIMARY KEY,
              case_id INTEGER NOT NULL,
              draft_text TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL,
              approved_at TEXT,
              FOREIGN KEY(case_id) REFERENCES cases(id)
            );

            CREATE TABLE IF NOT EXISTS validation_feedback (
              id INTEGER PRIMARY KEY,
              tester_role TEXT NOT NULL,
              task_tested TEXT NOT NULL,
              what_worked TEXT NOT NULL,
              confusing TEXT NOT NULL,
              improvement TEXT NOT NULL,
              final_feedback TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )

        count = conn.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
        if count == 0:
            conn.executemany(
                "INSERT INTO cases(id, case_code, title, category, status, next_hearing, owner) VALUES(?,?,?,?,?,?,?)",
                [
                    (1, "DEMO-CIV-001", "Property Document Review", "Civil", "Active", "2026-09-18", "Senior Advocate"),
                    (2, "DEMO-CON-002", "Service Agreement Review", "Contract", "Active", "2026-09-22", "Senior Advocate"),
                    (3, "DEMO-CIV-003", "Filing Follow-up", "Civil", "On Hold", "2026-10-03", "Junior Advocate"),
                ],
            )
            conn.executemany(
                "INSERT INTO tasks(id, case_id, title, assignee, due_date, status, priority) VALUES(?,?,?,?,?,?,?)",
                [
                    (1, 1, "Prepare document index", "Junior Advocate", "2026-09-13", "In Progress", "High"),
                    (2, 1, "Review draft note", "Senior Advocate", "2026-09-14", "Pending", "Medium"),
                    (3, 2, "Check clause differences", "Junior Advocate", "2026-09-16", "Pending", "Medium"),
                    (4, 3, "Confirm filing checklist", "Junior Advocate", "2026-09-12", "Done", "Low"),
                ],
            )
            conn.executemany(
                "INSERT INTO documents(id, case_id, name, doc_type, content, uploaded_at) VALUES(?,?,?,?,?,?)",
                [
                    (1, 1, "demo_property_note.txt", "Case Note", "This is synthetic demo content. The note lists property document references, identifies two missing attachments, and records that the senior advocate must review the final index before filing. No real client details are included.", "2026-09-08T10:00:00"),
                    (2, 2, "demo_agreement_summary.txt", "Agreement", "Synthetic service agreement demo. The document contains a payment clause, a thirty-day notice clause, and a confidentiality section. The team must compare the notice clause with the latest internal draft before review.", "2026-09-08T11:00:00"),
                    (3, 3, "demo_filing_checklist.txt", "Checklist", "Synthetic filing checklist. Verify document order, required signatures, attachment labels, and internal review status. Final submission must only occur after advocate approval.", "2026-09-09T09:00:00"),
                ],
            )
