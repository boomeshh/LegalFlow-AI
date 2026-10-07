"""
test_api.py — Pytest API tests for LegalFlow AI.

Covers:
  - Health check
  - Authentication (login, /auth/me, bad credentials, RBAC)
  - Dashboard
  - Cases (list, create, get)
  - Tasks (list, create, update)
  - Documents (list, get, create)
  - AI endpoints (summary, search, task-priority, client-update-draft)
  - Drafts (update text, approve)
  - Validation / Feedback (list, create)
"""
from __future__ import annotations

import pytest


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class TestAuth:
    def test_login_senior(self, client):
        resp = client.post("/auth/login", json={"username": "senior_advocate", "password": "demo123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["role"] == "senior_advocate"

    def test_login_junior(self, client):
        resp = client.post("/auth/login", json={"username": "junior_advocate", "password": "demo123"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "junior_advocate"

    def test_login_client(self, client):
        resp = client.post("/auth/login", json={"username": "client", "password": "demo123"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "client"

    def test_login_bad_password(self, client):
        resp = client.post("/auth/login", json={"username": "senior_advocate", "password": "wrong"})
        assert resp.status_code == 401

    def test_login_unknown_user(self, client):
        resp = client.post("/auth/login", json={"username": "nobody", "password": "demo123"})
        assert resp.status_code == 401

    def test_me_senior(self, client, senior_headers):
        resp = client.get("/auth/me", headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "senior_advocate"
        assert "cases:write" in data["permissions"]

    def test_me_no_token(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_rbac_client_cannot_access_tasks(self, client, client_headers):
        resp = client.get("/tasks", headers=client_headers)
        assert resp.status_code == 403

    def test_rbac_junior_cannot_approve_draft(self, client, junior_headers):
        # Try to approve draft 1 (may not exist — both 404 and 403 are acceptable; 403 must not become 200)
        resp = client.post("/drafts/1/approve", headers=junior_headers)
        assert resp.status_code in (403, 404)
        if resp.status_code == 403:
            assert "does not have" in resp.json()["detail"].lower() or "access" in resp.json()["detail"].lower()

    def test_rbac_client_cannot_create_case(self, client, client_headers):
        resp = client.post("/cases", json={
            "case_code": "RBAC-001", "title": "Test", "category": "Civil",
            "status": "Active", "owner": "Senior Advocate",
        }, headers=client_headers)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class TestDashboard:
    def test_dashboard_senior(self, client, senior_headers):
        resp = client.get("/dashboard", headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "case_count" in data
        assert "open_task_count" in data
        assert "pending_review_count" in data
        assert "upcoming_hearings" in data
        assert "open_tasks" in data

    def test_dashboard_client(self, client, client_headers):
        resp = client.get("/dashboard", headers=client_headers)
        assert resp.status_code == 200

    def test_dashboard_no_auth(self, client):
        resp = client.get("/dashboard")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Cases
# ---------------------------------------------------------------------------

class TestCases:
    def test_list_cases(self, client, senior_headers):
        resp = client.get("/cases", headers=senior_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 3  # seed data

    def test_create_case(self, client, senior_headers):
        resp = client.post("/cases", json={
            "case_code": "TEST-001",
            "title": "Test Case Alpha",
            "category": "Civil",
            "status": "Active",
            "next_hearing": "2026-12-01",
            "owner": "Senior Advocate",
        }, headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["case_code"] == "TEST-001"
        assert data["title"] == "Test Case Alpha"

    def test_create_case_duplicate_code(self, client, senior_headers):
        resp = client.post("/cases", json={
            "case_code": "TEST-001",
            "title": "Duplicate",
            "category": "Civil",
            "status": "Active",
            "owner": "Senior Advocate",
        }, headers=senior_headers)
        assert resp.status_code == 400

    def test_create_case_missing_title(self, client, senior_headers):
        resp = client.post("/cases", json={
            "case_code": "TEST-BAD",
            "title": "   ",
            "category": "Civil",
            "status": "Active",
            "owner": "Senior Advocate",
        }, headers=senior_headers)
        assert resp.status_code == 400

    def test_get_case(self, client, senior_headers):
        resp = client.get("/cases/1", headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "tasks" in data
        assert "documents" in data

    def test_get_case_not_found(self, client, senior_headers):
        resp = client.get("/cases/9999", headers=senior_headers)
        assert resp.status_code == 404

    def test_junior_can_read_cases(self, client, junior_headers):
        resp = client.get("/cases", headers=junior_headers)
        assert resp.status_code == 200

    def test_junior_cannot_create_case(self, client, junior_headers):
        resp = client.post("/cases", json={
            "case_code": "JNR-001", "title": "Junior Case",
            "category": "Civil", "status": "Active", "owner": "Junior Advocate",
        }, headers=junior_headers)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

class TestTasks:
    def test_list_tasks(self, client, senior_headers):
        resp = client.get("/tasks", headers=senior_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 4  # seed data

    def test_create_task(self, client, senior_headers):
        resp = client.post("/tasks", json={
            "case_id": 1,
            "title": "Review evidence file",
            "assignee": "Junior Advocate",
            "due_date": "2026-12-15",
            "priority": "High",
        }, headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Review evidence file"
        assert data["status"] == "Pending"

    def test_create_task_invalid_case(self, client, senior_headers):
        resp = client.post("/tasks", json={
            "case_id": 9999,
            "title": "Ghost task",
            "assignee": "Junior Advocate",
            "priority": "Low",
        }, headers=senior_headers)
        assert resp.status_code == 404

    def test_update_task_status(self, client, senior_headers):
        resp = client.patch("/tasks/1", json={"status": "In Progress"}, headers=senior_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "In Progress"

    def test_junior_can_list_tasks(self, client, junior_headers):
        resp = client.get("/tasks", headers=junior_headers)
        assert resp.status_code == 200

    def test_junior_can_create_task(self, client, junior_headers):
        resp = client.post("/tasks", json={
            "case_id": 1,
            "title": "Junior created task",
            "assignee": "Junior Advocate",
            "priority": "Medium",
        }, headers=junior_headers)
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

class TestDocuments:
    def test_list_documents(self, client, senior_headers):
        resp = client.get("/documents", headers=senior_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 3  # seed data

    def test_get_document(self, client, senior_headers):
        resp = client.get("/documents/1", headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data
        assert "content" in data

    def test_get_document_not_found(self, client, senior_headers):
        resp = client.get("/documents/9999", headers=senior_headers)
        assert resp.status_code == 404

    def test_create_document(self, client, senior_headers):
        resp = client.post("/documents", json={
            "case_id": 1,
            "name": "test_doc.txt",
            "doc_type": "Case Note",
            "content": "Synthetic test content for document creation test.",
        }, headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "test_doc.txt"

    def test_create_document_empty_content(self, client, senior_headers):
        resp = client.post("/documents", json={
            "case_id": 1,
            "name": "empty.txt",
            "doc_type": "Case Note",
            "content": "   ",
        }, headers=senior_headers)
        assert resp.status_code == 400

    def test_client_cannot_read_documents(self, client, client_headers):
        resp = client.get("/documents", headers=client_headers)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# AI endpoints
# ---------------------------------------------------------------------------

class TestAI:
    def test_ai_summary(self, client, senior_headers):
        resp = client.post("/ai/summary", json={"document_id": 1}, headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data
        assert len(data["summary"]) > 0
        assert "notice" in data

    def test_ai_summary_not_found(self, client, senior_headers):
        resp = client.post("/ai/summary", json={"document_id": 9999}, headers=senior_headers)
        assert resp.status_code == 404

    def test_ai_search_with_results(self, client, senior_headers):
        resp = client.post("/ai/search", json={"query": "property document"}, headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert isinstance(data["results"], list)
        assert len(data["results"]) > 0

    def test_ai_search_no_results(self, client, senior_headers):
        resp = client.post("/ai/search", json={"query": "xyzzynotamatch123"}, headers=senior_headers)
        assert resp.status_code == 200
        assert resp.json()["results"] == []

    def test_ai_search_empty_query(self, client, senior_headers):
        resp = client.post("/ai/search", json={"query": "  "}, headers=senior_headers)
        assert resp.status_code == 200
        assert resp.json()["results"] == []

    def test_ai_task_priority(self, client, senior_headers):
        resp = client.get("/ai/task-priority/1", headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "suggested_priority" in data
        assert "reason" in data
        assert "notice" in data

    def test_ai_task_priority_not_found(self, client, senior_headers):
        resp = client.get("/ai/task-priority/9999", headers=senior_headers)
        assert resp.status_code == 404

    def test_ai_client_draft(self, client, senior_headers):
        resp = client.post("/ai/client-update-draft", json={"case_id": 1}, headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "draft_text" in data
        assert "status" in data
        assert data["status"] == "Pending Review"

    def test_ai_client_draft_not_found_case(self, client, senior_headers):
        resp = client.post("/ai/client-update-draft", json={"case_id": 9999}, headers=senior_headers)
        assert resp.status_code == 404

    def test_junior_can_access_ai_search(self, client, junior_headers):
        resp = client.post("/ai/search", json={"query": "filing"}, headers=junior_headers)
        assert resp.status_code == 200

    def test_junior_cannot_generate_draft(self, client, junior_headers):
        resp = client.post("/ai/client-update-draft", json={"case_id": 1}, headers=junior_headers)
        assert resp.status_code == 403

    def test_client_cannot_access_ai(self, client, client_headers):
        resp = client.post("/ai/search", json={"query": "filing"}, headers=client_headers)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Drafts
# ---------------------------------------------------------------------------

class TestDrafts:
    @pytest.fixture(scope="class")
    def draft_id(self, client, senior_headers):
        """Create a fresh draft for draft tests."""
        resp = client.post("/ai/client-update-draft", json={"case_id": 2}, headers=senior_headers)
        assert resp.status_code == 200
        return resp.json()["id"]

    def test_update_draft_text(self, client, senior_headers, draft_id):
        resp = client.patch(
            f"/drafts/{draft_id}",
            json={"draft_text": "Updated advocate-reviewed draft text."},
            headers=senior_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["draft_text"] == "Updated advocate-reviewed draft text."

    def test_update_draft_empty_text(self, client, senior_headers, draft_id):
        resp = client.patch(
            f"/drafts/{draft_id}",
            json={"draft_text": "   "},
            headers=senior_headers,
        )
        assert resp.status_code == 400

    def test_approve_draft(self, client, senior_headers, draft_id):
        resp = client.post(f"/drafts/{draft_id}/approve", headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "Approved"
        assert data["approved_at"] is not None

    def test_junior_cannot_approve_draft(self, client, junior_headers, draft_id):
        resp = client.post(f"/drafts/{draft_id}/approve", headers=junior_headers)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Validation / Feedback
# ---------------------------------------------------------------------------

class TestValidation:
    def test_list_feedback_empty(self, client, senior_headers):
        resp = client.get("/validation", headers=senior_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_feedback(self, client, senior_headers):
        resp = client.post("/validation", json={
            "tester_role": "Senior Advocate",
            "task_tested": "AI Draft Generation",
            "what_worked": "Draft was generated quickly.",
            "confusing": "Approval button placement.",
            "improvement": "Add keyboard shortcut for approve.",
            "final_feedback": "Solid prototype. Minor UX tweaks needed.",
        }, headers=senior_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["tester_role"] == "Senior Advocate"

    def test_create_feedback_missing_field(self, client, senior_headers):
        resp = client.post("/validation", json={
            "tester_role": "Tester",
            "task_tested": "Something",
            "what_worked": "Fine",
            "confusing": "  ",   # blank — should fail
            "improvement": "More docs",
            "final_feedback": "OK",
        }, headers=senior_headers)
        assert resp.status_code == 400

    def test_junior_can_submit_feedback(self, client, junior_headers):
        resp = client.post("/validation", json={
            "tester_role": "Junior Advocate",
            "task_tested": "Task assignment",
            "what_worked": "Clear task list.",
            "confusing": "Priority badge colours.",
            "improvement": "Colour legend.",
            "final_feedback": "Works well for junior role.",
        }, headers=junior_headers)
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Retrieval abstraction
# ---------------------------------------------------------------------------

class TestRetrieval:
    def test_keyword_retriever_finds_results(self):
        from app.retrieval import KeywordRetriever
        r = KeywordRetriever()
        docs = [
            {"id": 1, "name": "note.txt", "case_code": "C-001",
             "content": "The filing deadline requires early document submission."},
            {"id": 2, "name": "other.txt", "case_code": "C-002",
             "content": "Unrelated content about weather."},
        ]
        results = r.search(docs, "filing deadline")
        assert len(results) == 1
        assert results[0]["document_id"] == 1

    def test_keyword_retriever_empty_query(self):
        from app.retrieval import KeywordRetriever
        r = KeywordRetriever()
        results = r.search([{"id": 1, "name": "a", "case_code": "X", "content": "text"}], "")
        assert results == []

    def test_keyword_retriever_short_tokens_ignored(self):
        from app.retrieval import KeywordRetriever
        r = KeywordRetriever()
        results = r.search(
            [{"id": 1, "name": "x", "case_code": "X", "content": "hello world"}],
            "hi",  # 2 chars — filtered out
        )
        assert results == []

    def test_get_retriever_returns_keyword_by_default(self):
        import os
        os.environ.pop("RETRIEVAL_BACKEND", None)
        from app.retrieval import get_retriever, KeywordRetriever
        r = get_retriever()
        assert isinstance(r, KeywordRetriever)
