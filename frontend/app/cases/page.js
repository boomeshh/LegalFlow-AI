'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../../lib/api';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [newCase, setNewCase] = useState({
    case_code: '',
    title: '',
    category: 'Civil',
    status: 'Active',
    next_hearing: '',
    owner: 'Senior Advocate',
  });

  const loadCases = async () => {
    try {
      const data = await getJSON('/cases');
      setCases(data);
    } catch (e) {
      setMessage('Failed to load demo cases. Make sure backend is running.');
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  async function handleCreateCase(e) {
    e.preventDefault();
    try {
      await sendJSON('/cases', 'POST', newCase);
      setMessage(`Case ${newCase.case_code} created successfully!`);
      setIsCreating(false);
      setNewCase({
        case_code: '',
        title: '',
        category: 'Civil',
        status: 'Active',
        next_hearing: '',
        owner: 'Senior Advocate',
      });
      loadCases();
    } catch (e) {
      setMessage(`Error: ${e.message}`);
    }
  }

  async function generateDraft(caseId) {
    setMessage('AI is drafting client status update based on case progress...');
    try {
      const d = await sendJSON('/ai/client-update-draft', 'POST', { case_id: caseId });
      setDraft(d);
      setDraftText(d.draft_text);
      setMessage('AI Draft Generated! Advocate review required before sending.');
    } catch (e) {
      setMessage(`Error generating draft: ${e.message}`);
    }
  }

  async function updateDraftText() {
    if (!draft) return;
    try {
      const updated = await sendJSON(`/drafts/${draft.id}`, 'PATCH', { draft_text: draftText });
      setDraft(updated);
      setMessage('Advocate edits saved.');
    } catch (e) {
      setMessage(`Error saving edits: ${e.message}`);
    }
  }

  async function approveDraft() {
    if (!draft) return;
    try {
      await updateDraftText();
      const approved = await sendJSON(`/drafts/${draft.id}/approve`, 'POST');
      setDraft(approved);
      setMessage('Draft approved by Advocate! Action enabled.');
    } catch (e) {
      setMessage(`Error approving draft: ${e.message}`);
    }
  }

  const filteredCases = cases.filter((c) =>
    c.case_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="card-head" style={{ marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">CASE MANAGEMENT</p>
          <h1>Legal Cases</h1>
        </div>
        <button onClick={() => setIsCreating(true)}>+ New Demo Case</button>
      </div>

      {message && <div className="notice info">{message}</div>}

      {/* SEARCH BAR */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Filter cases by code, title, or category (e.g. CIV, Service, Civil)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* CASES GRID */}
      <div className="grid three">
        {filteredCases.map((c) => (
          <article className="card" key={c.id}>
            <div className="card-head" style={{ marginBottom: '12px' }}>
              <span className={`badge ${c.status === 'Active' ? 'active' : 'on-hold'}`}>
                {c.status}
              </span>
              <strong style={{ color: 'var(--accent-light)' }}>{c.case_code}</strong>
            </div>

            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>{c.title}</h2>
            <p className="lead" style={{ fontSize: '13px', marginBottom: '4px' }}>
              Category: {c.category}
            </p>
            <p className="lead" style={{ fontSize: '13px', marginBottom: '4px' }}>
              Lead Advocate: {c.owner}
            </p>
            <p className="lead" style={{ fontSize: '13px', marginBottom: '16px' }}>
              Next Hearing: <strong style={{ color: '#ffffff' }}>{c.next_hearing || 'Not scheduled'}</strong>
            </p>

            <button className="secondary" style={{ width: '100%' }} onClick={() => generateDraft(c.id)}>
              ✨ Generate AI Client Update Draft
            </button>
          </article>
        ))}
      </div>

      {/* DRAFT REVIEW DRAWER */}
      {draft && (
        <section className="review-box card" style={{ marginTop: '32px' }}>
          <div className="card-head">
            <div>
              <p className="eyebrow">ADVOCATE REVIEW & APPROVAL</p>
              <h2>Draft Update — {draft.status}</h2>
            </div>
            <span className={`badge ${draft.status === 'Approved' ? 'approved' : 'high'}`}>
              {draft.status}
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-muted)' }}>
              Advocate Text Editor (Edit AI suggestion before approving):
            </label>
            <textarea
              disabled={draft.status === 'Approved'}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={6}
            />
          </div>

          <div className="notice warning" style={{ marginBottom: '16px', fontSize: '13px' }}>
            <strong>Responsible AI Rule:</strong> AI draft remains pending until the advocate explicitly edits and approves it.
          </div>

          {draft.status !== 'Approved' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="secondary" onClick={updateDraftText}>
                Save Edits
              </button>
              <button className="success" onClick={approveDraft}>
                Approve & Seal Draft
              </button>
            </div>
          )}
        </section>
      )}

      {/* CREATE CASE MODAL */}
      {isCreating && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-head">
              <h2>Add New Demo Case</h2>
              <button className="secondary" onClick={() => setIsCreating(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Case Code</span>
                <input
                  required
                  placeholder="e.g. DEMO-CIV-004"
                  value={newCase.case_code}
                  onChange={(e) => setNewCase({ ...newCase, case_code: e.target.value })}
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Case Title</span>
                <input
                  required
                  placeholder="e.g. Land Acquisition Appeal"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Category</span>
                <select
                  value={newCase.category}
                  onChange={(e) => setNewCase({ ...newCase, category: e.target.value })}
                >
                  <option value="Civil">Civil</option>
                  <option value="Contract">Contract</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Next Hearing Date</span>
                <input
                  type="date"
                  value={newCase.next_hearing}
                  onChange={(e) => setNewCase({ ...newCase, next_hearing: e.target.value })}
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Lead Advocate</span>
                <input
                  value={newCase.owner}
                  onChange={(e) => setNewCase({ ...newCase, owner: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="secondary" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button type="submit">Create Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
