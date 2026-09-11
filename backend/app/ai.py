from __future__ import annotations

from datetime import date
import re


def simple_summary(text: str) -> str:
    """Extracts key sentences from text to form a concise legal document summary."""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if len(sentences) <= 2:
        return " ".join(sentences)
    ranked = sorted(sentences, key=lambda s: len(set(re.findall(r"\w+", s.lower()))), reverse=True)
    chosen = ranked[:2]
    return " ".join(chosen)


def search_documents(docs: list[dict], query: str) -> list[dict]:
    """Performs keyword relevance matching across indexed document content."""
    terms = [t for t in re.findall(r"\w+", query.lower()) if len(t) > 2]
    if not terms:
        return []
    
    scored = []
    for doc in docs:
        haystack = f"{doc['name']} {doc['content']}".lower()
        score = sum(haystack.count(t) for t in terms)
        if score > 0:
            scored.append({
                "document_id": doc["id"],
                "name": doc["name"],
                "case_code": doc["case_code"],
                "score": score,
                "preview": doc["content"][:220] + ("..." if len(doc["content"]) > 220 else ""),
            })
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def evaluate_task_priority(task: dict) -> dict:
    """Determines recommended task priority based on deadline proximity."""
    suggested = task["priority"]
    reason = "Existing priority retained."
    if task["status"] != "Done" and task["due_date"]:
        try:
            days = (date.fromisoformat(task["due_date"]) - date.today()).days
            if days <= 2:
                suggested = "High"
                reason = f"Due date ({task['due_date']}) is within 2 days. Urgency recommended."
            elif days <= 5:
                suggested = "Medium"
                reason = f"Due date ({task['due_date']}) is within 5 days."
        except ValueError:
            pass
    return {
        "suggested_priority": suggested,
        "reason": reason,
        "notice": "Suggestion only. Advocate decides.",
    }


def generate_client_draft_text(case: dict, tasks: list[dict]) -> str:
    """Drafts a client status update summarizing progress and upcoming hearings."""
    done_count = sum(1 for t in tasks if t["status"] == "Done")
    total_count = len(tasks)
    return (
        f"Client Status Update for {case['case_code']} ({case['title']}):\n"
        f"- Current Case Status: {case['status']}\n"
        f"- Task Progress: {done_count} of {total_count} scheduled tasks completed.\n"
        f"- Next Hearing / Milestone: {case['next_hearing'] or 'TBD'}\n\n"
        "Draft Note: Please be advised that preliminary document checks are underway. "
        "The senior advocate will present the index during the upcoming proceeding. "
        "[AI Generated Draft - Advocate Review Required before client dispatch]"
    )
