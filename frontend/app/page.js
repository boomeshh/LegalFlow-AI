'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard, approveDraft } from '../lib/api';
import StatCard from '../components/StatCard';
import DraftReviewCard from '../components/DraftReviewCard';
import { CourthouseIcon, BriefcaseIcon, GavelIcon, SparklesIcon, CalendarIcon, ShieldCheckIcon, CheckIcon, ClockIcon } from '../components/Icons';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  const loadData = () => {
    fetchDashboard()
      .then((d) => {
        setData(d);
        if (d.pending_drafts) setDrafts(d.pending_drafts);
      })
      .catch(() => setError('Backend is not running. Please start FastAPI on port 8000.'));
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleApproveDraft(draftId) {
    setApprovingId(draftId);
    try {
      await approveDraft(draftId);
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
        <StatCard icon={BriefcaseIcon} label="Total Cases" value={data?.case_count} />
        <StatCard icon={GavelIcon} label="Open Tasks" value={data?.open_task_count} />
        <StatCard icon={SparklesIcon} label="Pending AI Drafts" value={data?.pending_review_count} />
        <StatCard icon={CalendarIcon} label="Upcoming Hearings" value={data?.upcoming_hearings?.length} />
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
      {drafts.map((draft) => (
        <DraftReviewCard
          key={draft.id}
          draft={draft}
          onApprove={handleApproveDraft}
          isApproving={approvingId === draft.id}
        />
      ))}

      <div className="notice info" style={{ marginTop: '28px' }}>
        <ShieldCheckIcon size={18} />
        <div>
          <strong>Demo Safety Notice:</strong> All data displayed is synthetic demo data. LegalFlow AI provides automated workflow recommendations only; final legal decisions remain strictly with the advocate.
        </div>
      </div>
    </div>
  );
}
