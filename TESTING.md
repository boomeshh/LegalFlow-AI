# LegalFlow AI Testing Guide

This guide describes the tests that are currently in the repository, the
behaviour they verify, the important edge cases, and how to run the backend
tests and frontend production build. It documents the current demo
implementation; it does not claim coverage for features that are not present.

## Test layers

### Backend API tests

`backend/tests/test_api.py` uses pytest and FastAPI's `TestClient`. The
session fixture creates a temporary file-backed SQLite database, sets
`LEGALFLOW_DB` before importing the application, initializes the schema, and
seeds the demo rows. This keeps tests isolated from
`backend/legalflow_demo.db` while allowing separate SQLite connections to see
the same data during a test session.

The suite exercises:

- `GET /health`
- Login for all three demo users, bad passwords, unknown users, `/auth/me`,
  missing tokens, and role-based access checks
- Dashboard access for advocate and client roles
- Case listing, creation, duplicate codes, blank titles, detail lookup,
  missing cases, and junior read-only access
- Task listing, creation, invalid case references, updates, and permissions
- Document listing, detail lookup, creation, validation, and permissions
- Summary, keyword search, priority suggestion, and client-update draft flows
- Draft editing, advocate approval, missing drafts, and RBAC restrictions
- Validation feedback listing, creation, required-field validation, and
  permissions
- Retrieval behaviour, including ignored short search tokens and ranked
  matching results

Tests intentionally assert both response status codes and useful response
fields. For permission tests, a `401` means authentication is missing or
invalid, while a `403` means a valid user lacks the required permission.

### Frontend production build

The frontend currently has no separate Jest or component-test suite. The
production build is the verification step for the Next.js/React application.
It checks that all routes, client components, imports, and the App Router
error boundary compile successfully.

## Edge cases and error behaviour

### Authentication errors

- Missing `Authorization: Bearer <token>` on protected endpoints returns
  `401` with a `WWW-Authenticate: Bearer` header.
- Invalid or expired JWTs return `401`.
- A token whose subject is not in the in-memory demo user store returns `401`.
- Invalid login credentials return `401`.
- The frontend clears its stored token after a `401` and reports that the
  session has expired.

### Authorization errors

Authentication and authorization are separate checks. `get_current_user`
validates the token, and `require_permission(...)` checks the user's role
permission set. A valid user without the required permission receives `403`;
the frontend displays the API error instead of treating it as success.

### Validation and not-found errors

- Pydantic request models reject malformed or missing request fields before
  route logic runs (FastAPI returns `422`).
- Route-level checks reject blank required strings, duplicate case codes, and
  empty draft/feedback content with `400`.
- References to missing cases, tasks, documents, or drafts return `404`.
- Empty AI search text is an intentional valid response with an empty result
  list, not an exception.

### API and rendering failures

`frontend/lib/api.js` converts non-success responses into `Error` objects,
including the backend `detail` when present. Page-level handlers display those
messages for user actions and loading failures. The route-level
`frontend/app/error.js` boundary handles unexpected React rendering errors and
offers a retry without changing API or authentication semantics.

The backend uses FastAPI's standard exception handling: explicit
`HTTPException` responses from route and authentication logic, and FastAPI's
validation response for invalid Pydantic payloads. There is no custom
catch-all backend handler; unexpected programming or database errors are
allowed to surface to the server logs rather than being returned as a
misleading success response.

## Running verification locally

From PowerShell on Windows:

```powershell
cd backend
.\.venv312\Scripts\Activate.ps1
pytest tests/ -v --tb=short
```

From a POSIX shell:

```bash
cd backend
source .venv312/bin/activate
pytest tests/ -v --tb=short
```

Run the frontend production build in a second terminal:

```powershell
cd frontend
npm run build
```

`npm install` is only needed when the frontend dependencies are not already
installed. The CI workflow runs the same two checks with Python 3.11 and
Node.js 20.

## Adding tests

New backend behaviour should normally get a focused test in
`backend/tests/test_api.py`. Include the successful response shape plus the
relevant authentication, permission, validation, not-found, or empty-input
case. Use the existing fixtures and do not point tests at the checked-in demo
database. If a frontend component test framework is introduced later, keep
the production build as a required smoke check because it validates the
App Router integration.
