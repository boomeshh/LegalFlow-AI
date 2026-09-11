'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import { BriefcaseIcon, PlusIcon, SearchIcon, SparklesIcon, CalendarIcon, UserIcon, GavelIcon, CheckIcon, CloseIcon, ShieldCheckIcon } from '../../components/Icons';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    setMessage('AI is drafting client status update based on case progress...');
    try {
      const d = await sendJSON('/ai/client-update-draft', 'POST', { case_id: caseId });
      setDraft(d);
      setDraftText(d.draft_text);
      setMessage('AI Draft Generated! Advocate review required before sending.');
    } catch (e) {
      setMessage(`Error generating draft: ${e.message}`);
    } finally {
      setIsGenerating(false);
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
      <PageHeader
        breadcrumbs={[{ label: 'Cases' }]}
        eyebrow="CASE MANAGEMENT & DOCKET"
        title="Legal Cases & Matters"
        subtitle="Track active legal proceedings, scheduled hearings, lead advocates, and AI client communications."
        action={
          <button onClick={() => setIsCreating(true)}>
            <PlusIcon size={16} />
            <span>New Demo Case</span>
          </button>
        }
      />

      {message && <div className="notice info">{message}</div>}

      {/* SEARCH BAR */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SearchIcon size={18} style={{ color: 'var(--gold-600)' }} />
          <input
            type="text"
            placeholder="Search cases by code, title, or category (e.g. CIV, Service, Civil)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
          />
          {searchQuery && (
            <span className="badge" style={{ flexShrink: 0 }}>
              {filteredCases.length} found
            </span>
          )}
        </div>
      </div>

      {/* CASES GRID */}
      {filteredCases.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <BriefcaseIcon size={24} />
          </div>
          <h3 className="empty-state-title">No Cases Found</h3>
          <p className="empty-state-desc">No demo cases match your search query. Try clearing the filter or create a new case.</p>
        </div>
      ) : (
        <div className="grid three">
          {filteredCases.map((c) => (
            <article className="card" key={c.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-head" style={{ marginBottom: '14px' }}>
                  <span className={`badge ${c.status === 'Active' ? 'active' : 'on-hold'}`}>
                    {c.status}
                  </span>
                  <strong style={{ color: 'var(--gold-700)', fontFamily: 'var(--font-serif)', fontSize: '15px' }}>
                    {c.case_code}
                  </strong>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', marginBottom: '10px', color: 'var(--navy-950)' }}>
                  {c.title}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge info">{c.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <UserIcon size={14} />
                    <span>Lead Advocate: <strong style={{ color: 'var(--navy-900)' }}>{c.owner}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={14} />
                    <span>Next Hearing: <strong style={{ color: 'var(--navy-950)' }}>{c.next_hearing || 'Not scheduled'}</strong></span>
                  </div>
                </div>
              </div>

              <button
                className="secondary"
                disabled={isGenerating}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => generateDraft(c.id)}
              >
                <SparklesIcon size={14} style={{ color: 'var(--gold-600)' }} />
                <span>Generate AI Client Update Draft</span>
              </button>
            </article>
          ))}
        </div>
      )}

      {/* DRAFT REVIEW DRAWER */}
      {draft && (
        <section className="review-box" style={{ marginTop: '32px' }}>
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GavelIcon size={22} style={{ color: 'var(--gold-600)' }} />
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>ADVOCATE REVIEW & APPROVAL</p>
                <h2 style={{ fontSize: '20px' }}>Draft Client Update — #{draft.id}</h2>
              </div>
            </div>
            <span className={`badge ${draft.status === 'Approved' ? 'approved' : 'high'}`}>
              Status: {draft.status}
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label>
              <span className="form-label-text">
                Advocate Text Editor (Edit AI suggestion before approving):
              </span>
              <textarea
                disabled={draft.status === 'Approved'}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={6}
                style={{ marginTop: '6px' }}
              />
            </label>
          </div>

          <div className="notice warning" style={{ marginBottom: '20px', fontSize: '13px' }}>
            <ShieldCheckIcon size={16} />
            <div>
              <strong>Responsible AI Rule:</strong> AI draft remains pending until the advocate explicitly edits and approves it.
            </div>
          </div>

          {draft.status !== 'Approved' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="secondary" onClick={updateDraftText}>
                Save Edits
              </button>
              <button className="success" onClick={approveDraft}>
                <CheckIcon size={16} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BriefcaseIcon size={20} style={{ color: 'var(--gold-600)' }} />
                <h2>Add New Demo Case</h2>
              </div>
              <button className="secondary" style={{ padding: '6px' }} onClick={() => setIsCreating(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <label>
                <span className="form-label-text">Case Code</span>
                <input
                  required
                  placeholder="e.g. DEMO-CIV-004"
                  value={newCase.case_code}
                  onChange={(e) => setNewCase({ ...newCase, case_code: e.target.value })}
                />
              </label>

              <label>
                <span className="form-label-text">Case Title</span>
                <input
                  required
                  placeholder="e.g. Land Acquisition Appeal"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                />
              </label>

              <label>
                <span className="form-label-text">Category</span>
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
                <span className="form-label-text">Next Hearing Date</span>
                <input
                  type="date"
                  value={newCase.next_hearing}
                  onChange={(e) => setNewCase({ ...newCase, next_hearing: e.target.value })}
                />
              </label>

              <label>
                <span className="form-label-text">Lead Advocate</span>
                <input
                  value={newCase.owner}
                  onChange={(e) => setNewCase({ ...newCase, owner: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="secondary" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="gold">
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
