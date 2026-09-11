export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function getJSON(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function sendJSON(path, method = 'POST', body = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed with status ${res.status}`);
  }
  return data;
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
