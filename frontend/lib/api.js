export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/** Read stored token from localStorage (browser only). */
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('legalflow_token');
}

/** Build Authorization header if a token is present. */
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getJSON(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: { ...authHeaders() },
  });
  if (res.status === 401) {
    // Token expired or missing — clear and let UI redirect
    if (typeof window !== 'undefined') localStorage.removeItem('legalflow_token');
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function sendJSON(path, method = 'POST', body = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (typeof window !== 'undefined') localStorage.removeItem('legalflow_token');
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    throw new Error(data.detail || `Request failed with status ${res.status}`);
  }
  return data;
}

/* Auth */
export async function login(username, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Login failed.');
  return data; // { access_token, role, display_name }
}

export async function fetchCurrentUser() {
  return getJSON('/auth/me');
}

/* API Client Functions */

export const fetchDashboard = () => getJSON('/dashboard');

export const fetchCases = () => getJSON('/cases');
export const createCase = (payload) => sendJSON('/cases', 'POST', payload);
export const fetchCase = (caseId) => getJSON(`/cases/${caseId}`);

export const fetchTasks = () => getJSON('/tasks');
export const createTask = (payload) => sendJSON('/tasks', 'POST', payload);
export const updateTaskStatus = (taskId, status) => sendJSON(`/tasks/${taskId}`, 'PATCH', { status });

export const fetchDocuments = () => getJSON('/documents');
export const fetchDocument = (docId) => getJSON(`/documents/${docId}`);
export const createDocument = (payload) => sendJSON('/documents', 'POST', payload);

export const searchAIDocuments = (query) => sendJSON('/ai/search', 'POST', { query });
export const summarizeAIDocument = (document_id) => sendJSON('/ai/summary', 'POST', { document_id });
export const fetchTaskPriority = (taskId) => getJSON(`/ai/task-priority/${taskId}`);
export const generateAIClientDraft = (case_id) => sendJSON('/ai/client-update-draft', 'POST', { case_id });

export const updateDraftText = (draftId, draft_text) => sendJSON(`/drafts/${draftId}`, 'PATCH', { draft_text });
export const approveDraft = (draftId) => sendJSON(`/drafts/${draftId}/approve`, 'POST');

export const fetchFeedback = () => getJSON('/validation');
export const submitFeedback = (payload) => sendJSON('/validation', 'POST', payload);
