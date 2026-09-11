'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../lib/api';
import { CourthouseIcon, BriefcaseIcon, GavelIcon, DocumentIcon, CalendarIcon, ShieldCheckIcon, CheckIcon, ClockIcon, SparklesIcon } from '../components/Icons';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const [approvingId, setApprovingId] = useState(null);

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
    setApprovingId(draftId);
    try {
      await sendJSON(`/drafts/${draftId}/approve`, 'POST');
      setActionMessage('Draft approved successfully by advocate!');
      loadData();
    } catch (e) {
      setActionMessage(e.message);
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero">
        <div>
          <p className="eyebrow">
            <CourthouseIcon size={14} />
            LEGAL WORKFLOW PLATFORM
          </p>
          <h1>LegalFlow AI Workflow Assistant</h1>
          <p className="lead">
            AI-powered workflow coordination for senior & junior advocates. AI assists with tasks, documents, and updates while human advocate review ensures complete procedural control.
          </p>
        </div>

        <div className="hero-principle-card">
          <span>
            <ShieldCheckIcon size={14} />
            Responsible AI Principle
          </span>
          <strong>AI suggests → Advocate reviews → Advocate approves → Action happens.</strong>
        </div>
      </section>

      {error && (
        <div className="notice warning">
          <ClockIcon size={18} />
          <div>{error}</div>
        </div>
      )}
      {actionMessage && (
        <div className="notice success">
          <CheckIcon size={18} />
          <div>{actionMessage}</div>
        </div>
      )}

      {/* METRICS STATS */}
      <section className="grid stats">
        <article className="card stat-card">
          <div className="stat-icon-box">
            <BriefcaseIcon size={22} />
          </div>
          <div className="stat-info">
            <span>Total Cases</span>
            <strong>{data?.case_count ?? '—'}</strong>
          </div>
        </article>

        <article className="card stat-card">
          <div className="stat-icon-box">
            <GavelIcon size={22} />
          </div>
          <div className="stat-info">
            <span>Open Tasks</span>
            <strong>{data?.open_task_count ?? '—'}</strong>
          </div>
        </article>

        <article className="card stat-card">
          <div className="stat-icon-box">
            <SparklesIcon size={22} />
          </div>
          <div className="stat-info">
            <span>Pending AI Drafts</span>
            <strong>{data?.pending_review_count ?? '—'}</strong>
          </div>
        </article>

        <article className="card stat-card">
          <div className="stat-icon-box">
            <CalendarIcon size={22} />
          </div>
          <div className="stat-info">
            <span>Upcoming Hearings</span>
            <strong>{data?.upcoming_hearings?.length ?? '—'}</strong>
          </div>
        </article>
      </section>

      {/* MAIN DASHBOARD CONTENT */}
      <section className="grid two">
        {/* UPCOMING HEARINGS & REMINDERS */}
        <article className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={18} style={{ color: 'var(--gold-600)' }} />
              <h2>Hearing & Deadline Reminders</h2>
            </div>
            <span className="badge warning">Upcoming Docket</span>
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
                {(data?.upcoming_hearings || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No upcoming hearings scheduled.
                    </td>
                  </tr>
                ) : (
                  (data?.upcoming_hearings || []).map((c) => (
                    <tr key={c.id}>
                      <td><strong style={{ color: 'var(--navy-950)' }}>{c.case_code}</strong></td>
                      <td>{c.title}</td>
                      <td><span className="badge high"><ClockIcon size={12} /> {c.next_hearing}</span></td>
                      <td><span className="badge active">{c.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* OPEN WORK & TASKS */}
        <article className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GavelIcon size={18} style={{ color: 'var(--gold-600)' }} />
              <h2>Active Task Assignments</h2>
            </div>
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
                {(data?.open_tasks || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No open tasks assigned.
                    </td>
                  </tr>
                ) : (
                  (data?.open_tasks || []).map((t) => (
                    <tr key={t.id}>
                      <td><strong style={{ color: 'var(--navy-950)' }}>{t.title}</strong></td>
                      <td><span className="badge">{t.assignee}</span></td>
                      <td>
                        <span className={`badge ${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td><span className="badge">{t.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* PENDING ADVOCATE REVIEW WIDGET */}
      {drafts.length > 0 && (
        <section className="review-box">
          <div className="card-head" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SparklesIcon size={20} style={{ color: 'var(--gold-600)' }} />
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>ADVOCATE APPROVAL QUEUE</p>
                <h2>AI Generated Client Status Drafts</h2>
              </div>
            </div>
            <span className="badge high">Action Required</span>
          </div>

          <p className="lead" style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            The following updates were drafted by LegalFlow AI. They must be reviewed and approved by an advocate prior to dispatch.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {drafts.map((draft) => (
              <div key={draft.id} className="result-box" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--navy-950)' }}>
                    Draft Update #{draft.id} — Status: {draft.status}
                  </strong>
                  <span className="badge gold">Pending Advocate Approval</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '16px', lineHeight: '1.6' }}>{draft.draft_text}</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="success"
                    disabled={approvingId === draft.id}
                    onClick={() => approveDraft(draft.id)}
                  >
                    <CheckIcon size={16} />
                    {approvingId === draft.id ? 'Approving...' : 'Approve & Seal Draft'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="notice info" style={{ marginTop: '28px' }}>
        <ShieldCheckIcon size={18} />
        <div>
          <strong>Demo Safety Notice:</strong> All data displayed is synthetic demo data. LegalFlow AI provides automated workflow recommendations only; final legal decisions remain strictly with the advocate.
        </div>
      </div>
    </div>
  );
}
