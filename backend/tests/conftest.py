"""
conftest.py — Shared pytest fixtures for LegalFlow AI API tests.

Uses a temporary file-based SQLite database (auto-deleted after session)
to avoid the per-connection isolation issue of :memory: DBs.

LEGALFLOW_DB must be set before any app import.
"""
from __future__ import annotations

import os
import tempfile
import pytest

# Create a temp DB file that persists for the whole test session
_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()
os.environ["LEGALFLOW_DB"] = _tmp_db.name

# Import app AFTER env var is set
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db


@pytest.fixture(scope="session", autouse=True)
def _init_database():
    """Initialise schema + seed data once for the whole test session."""
    init_db()


@pytest.fixture(scope="session")
def client(_init_database):
    """Session-scoped TestClient — shares the same temp DB as the app."""
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Auth token helpers
# ---------------------------------------------------------------------------

def _token(c: TestClient, username: str) -> str:
    resp = c.post("/auth/login", json={"username": username, "password": "demo123"})
    assert resp.status_code == 200, f"Login failed for '{username}': {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def senior_token(client):
    return _token(client, "senior_advocate")


@pytest.fixture(scope="session")
def junior_token(client):
    return _token(client, "junior_advocate")


@pytest.fixture(scope="session")
def client_token(client):
    return _token(client, "client")


@pytest.fixture(scope="session")
def senior_headers(senior_token):
    return {"Authorization": f"Bearer {senior_token}"}


@pytest.fixture(scope="session")
def junior_headers(junior_token):
    return {"Authorization": f"Bearer {junior_token}"}


@pytest.fixture(scope="session")
def client_headers(client_token):
    return {"Authorization": f"Bearer {client_token}"}
