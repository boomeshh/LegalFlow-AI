"""
auth.py — Simple demo authentication & RBAC for LegalFlow AI.

Demo users (no real credentials — for prototype/review only):
  username: senior_advocate  password: demo123  role: senior_advocate
  username: junior_advocate  password: demo123  role: junior_advocate
  username: client           password: demo123  role: client

Role access matrix:
  senior_advocate — full access to all endpoints
  junior_advocate — tasks, permitted case/doc read access; no draft approval, no case create
  client          — read-only case list and case status; no tasks, no documents, no AI

Implementation uses PyJWT for signed tokens (no DB required for demo).
Secret key is fixed demo-only value — not for production use.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

try:
    import jwt  # PyJWT
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Demo configuration
# ---------------------------------------------------------------------------

DEMO_SECRET = "legalflow-demo-secret-not-for-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 8

# Demo user store — in-memory, no DB required
DEMO_USERS: dict[str, dict] = {
    "senior_advocate": {
        "username": "senior_advocate",
        "password": "demo123",
        "role": "senior_advocate",
        "display_name": "Senior Advocate (Demo)",
    },
    "junior_advocate": {
        "username": "junior_advocate",
        "password": "demo123",
        "role": "junior_advocate",
        "display_name": "Junior Advocate (Demo)",
    },
    "client": {
        "username": "client",
        "password": "demo123",
        "role": "client",
        "display_name": "Client (Demo)",
    },
}

# ---------------------------------------------------------------------------
# Role permission definitions
# ---------------------------------------------------------------------------

# Each role maps to a set of allowed permission tags used in endpoints.
ROLE_PERMISSIONS: dict[str, set[str]] = {
    "senior_advocate": {
        "cases:read", "cases:write",
        "tasks:read", "tasks:write",
        "documents:read", "documents:write",
        "drafts:read", "drafts:write", "drafts:approve",
        "ai:all", "ai:summary", "ai:search", "ai:priority",
        "validation:read", "validation:write",
        "dashboard:read",
    },
    "junior_advocate": {
        "cases:read",
        "tasks:read", "tasks:write",
        "documents:read",
        "drafts:read",
        "ai:summary", "ai:search", "ai:priority",
        "validation:read", "validation:write",
        "dashboard:read",
    },
    "client": {
        "cases:read",
        "dashboard:read",
    },
}


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    display_name: str


def create_token(username: str, role: str) -> str:
    if not JWT_AVAILABLE:
        # Fallback: encode as plain string when PyJWT not installed
        return f"demo-{username}-{role}"
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, DEMO_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    if not JWT_AVAILABLE:
        # Fallback: parse demo token
        if token.startswith("demo-"):
            parts = token.split("-", 2)
            if len(parts) == 3:
                return {"sub": parts[1], "role": parts[2]}
        return None
    try:
        return jwt.decode(token, DEMO_SECRET, algorithms=[ALGORITHM])
    except Exception:
        # Treat malformed, expired, and incorrectly signed demo tokens alike.
        # The dependency below turns all of them into a consistent 401.
        return None


# ---------------------------------------------------------------------------
# FastAPI dependency — extract current user from Bearer token
# ---------------------------------------------------------------------------

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    """Dependency: returns current user dict or raises 401."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = DEMO_USERS.get(payload.get("sub", ""))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    return user


def require_permission(permission: str):
    """Dependency factory: raises 403 if user lacks the required permission."""
    def _check(user: dict = Depends(get_current_user)) -> dict:
        # Authentication has already succeeded; this check enforces RBAC.
        allowed = ROLE_PERMISSIONS.get(user["role"], set())
        if permission not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user['role']}' does not have '{permission}' access.",
            )
        return user
    return _check


# ---------------------------------------------------------------------------
# Login endpoint handler (called from main.py)
# ---------------------------------------------------------------------------

def login_handler(payload: LoginRequest) -> TokenResponse:
    user = DEMO_USERS.get(payload.username)
    if not user or user["password"] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    token = create_token(user["username"], user["role"])
    return TokenResponse(
        access_token=token,
        role=user["role"],
        display_name=user["display_name"],
    )
