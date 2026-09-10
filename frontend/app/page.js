'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [actionMessage, setActionMessage] = useState('');

  const loadData = () => {
    getJSON('/dashboard')
      .then((d) => {
        setData(d);
        if (d.pending_drafts) setDrafts(d.pending_drafts);
      })
      .catch(() => setError('Backend is not running. Please start FastAPI on port 8000.'));
  };

  useEffect(() => {
    loadData();
  }, []);

  async function approveDraft(draftId) {
    try {
      await sendJSON(`/drafts/${draftId}/approve`, 'POST');
      setActionMessage('Draft approved successfully by advocate!');
      loadData();
    } catch (e) {
      setActionMessage(e.message);
    }
  }

  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero">
        <div>
          <p className="eyebrow">AI-POWERED LEGAL WORKFLOW PLATFORM</p>
          <h1>LegalFlow AI Workflow Assistant</h1>
          <p className="lead">
            AI-powered workflow coordination for senior & junior advocates. AI assists with tasks, documents, and updates while human advocate review ensures complete control.
          </p>
        </div>

        <div className="hero-principle-card">
          <span>Responsible AI Principle</span>
          <strong>AI suggests → Advocate reviews → Advocate approves → Action happens.</strong>
        </div>
      </section>

      {error && <div className="notice warning">{error}</div>}
      {actionMessage && <div className="notice info">{actionMessage}</div>}

      {/* METRICS STATS */}
      <section className="grid stats">
        <article className="card stat-card">
          <span>Total Demo Cases</span>
          <strong>{data?.case_count ?? '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Open Tasks</span>
          <strong>{data?.open_task_count ?? '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Pending AI Drafts</span>
          <strong>{data?.pending_review_count ?? '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Upcoming Hearings</span>
          <strong>{data?.upcoming_hearings?.length ?? '—'}</strong>
        </article>
      </section>

      {/* MAIN DASHBOARD CONTENT */}
      <section className="grid two">
        {/* UPCOMING HEARINGS & REMINDERS */}
        <article className="card">
          <div className="card-head">
            <h2>Hearing & Deadline Reminders</h2>
            <span className="badge warning">Upcoming</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case Code</th>
                  <th>Title</th>
                  <th>Hearing Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.upcoming_hearings || []).map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.case_code}</strong></td>
                    <td>{c.title}</td>
                    <td><span className="badge high">{c.next_hearing}</span></td>
                    <td><span className="badge active">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* OPEN WORK & TASKS */}
        <article className="card">
          <div className="card-head">
            <h2>Active Task Assignments</h2>
            <span className="badge pending">Advocate / Junior</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.open_tasks || []).map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.title}</strong></td>
                    <td>{t.assignee}</td>
                    <td>
                      <span className={`badge ${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td><span className="badge">{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* PENDING ADVOCATE REVIEW WIDGET */}
      {drafts.length > 0 && (
        <section className="review-box card">
          <div className="card-head">
            <h2>Advocate Review Queue (AI Generated Drafts)</h2>
            <span className="badge high">Requires Advocate Action</span>
          </div>
          <p className="lead" style={{ fontSize: '14px', marginBottom: '16px' }}>
            The following draft updates were generated by AI. They must be reviewed and approved by an advocate before dispatch.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {drafts.map((draft) => (
              <div key={draft.id} className="result-box" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Draft #{draft.id} — Status: {draft.status}</strong>
                  <span className="badge pending">Pending Approval</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '12px' }}>{draft.draft_text}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="success" onClick={() => approveDraft(draft.id)}>
                    Approve Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="notice info" style={{ marginTop: '24px' }}>
        <strong>Demo Safety Notice:</strong> All data displayed is synthetic demo data. LegalFlow AI provides automated workflow recommendations only; final legal decisions remain strictly with the advocate.
      </div>
    </div>
  );
}
