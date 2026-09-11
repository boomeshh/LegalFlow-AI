'use client';

import { useEffect, useState } from 'react';
import { fetchCases, createCase, generateAIClientDraft, updateDraftText, approveDraft } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import DraftReviewCard from '../../components/DraftReviewCard';
import EmptyState from '../../components/EmptyState';
import { BriefcaseIcon, PlusIcon, SearchIcon, SparklesIcon, CalendarIcon, UserIcon, CloseIcon } from '../../components/Icons';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

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
      const data = await fetchCases();
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
      await createCase(newCase);
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

  async function handleGenerateDraft(caseId) {
    setIsGenerating(true);
    setMessage('AI is drafting client status update based on case progress...');
    try {
      const d = await generateAIClientDraft(caseId);
      setDraft(d);
      setDraftText(d.draft_text);
      setMessage('AI Draft Generated! Advocate review required before sending.');
    } catch (e) {
      setMessage(`Error generating draft: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveEdits() {
    if (!draft) return;
    try {
      const updated = await updateDraftText(draft.id, draftText);
      setDraft(updated);
      setMessage('Advocate edits saved.');
    } catch (e) {
      setMessage(`Error saving edits: ${e.message}`);
    }
  }

  async function handleApproveDraft() {
    if (!draft) return;
    setIsApproving(true);
    try {
      await updateDraftText(draft.id, draftText);
      const approved = await approveDraft(draft.id);
      setDraft(approved);
      setMessage('Draft approved by Advocate! Action enabled.');
    } catch (e) {
      setMessage(`Error approving draft: ${e.message}`);
    } finally {
      setIsApproving(false);
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
        <EmptyState
          icon={BriefcaseIcon}
          title="No Cases Found"
          description="No demo cases match your search query. Try clearing the filter or create a new case."
        />
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
                onClick={() => handleGenerateDraft(c.id)}
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
        <DraftReviewCard
          draft={draft}
          isEditable={true}
          draftText={draftText}
          setDraftText={setDraftText}
          onSaveEdits={handleSaveEdits}
          onApprove={handleApproveDraft}
          isApproving={isApproving}
        />
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
