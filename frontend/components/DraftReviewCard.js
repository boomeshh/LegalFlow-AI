import { GavelIcon, SparklesIcon, CheckIcon, ShieldCheckIcon } from './Icons';

export default function DraftReviewCard({
  draft,
  onApprove,
  isApproving = false,
  isEditable = false,
  draftText = '',
  setDraftText = () => {},
  onSaveEdits = () => {},
}) {
  if (!draft) return null;

  const isApproved = draft.status === 'Approved';

  return (
    <section className="review-box" style={{ marginTop: '28px' }}>
      <div className="card-head" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GavelIcon size={22} style={{ color: 'var(--gold-600)' }} />
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>ADVOCATE REVIEW & APPROVAL</p>
            <h2 style={{ fontSize: '19px' }}>Draft Update #{draft.id} — Status: {draft.status}</h2>
          </div>
        </div>
        <span className={`badge ${isApproved ? 'approved' : 'high'}`}>
          {isApproved ? 'Approved & Sealed' : 'Pending Advocate Action'}
        </span>
      </div>

      {isEditable ? (
        <div style={{ marginBottom: '16px' }}>
          <label>
            <span className="form-label-text">
              Advocate Text Editor (Edit AI suggestion before approving):
            </span>
            <textarea
              disabled={isApproved}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={6}
              style={{ marginTop: '6px' }}
            />
          </label>
        </div>
      ) : (
        <div className="result-box" style={{ margin: '0 0 16px 0' }}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.65' }}>{draft.draft_text}</p>
        </div>
      )}

      <div className="notice warning" style={{ marginBottom: '20px', fontSize: '13px' }}>
        <ShieldCheckIcon size={16} />
        <div>
          <strong>Responsible AI Rule:</strong> AI draft remains pending until the advocate explicitly reviews and approves it.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {isEditable && !isApproved && (
          <button className="secondary" onClick={onSaveEdits}>
            Save Edits
          </button>
        )}
        {!isApproved && (
          <button
            className="success"
            disabled={isApproving}
            onClick={() => onApprove(draft.id)}
          >
            <CheckIcon size={16} />
            <span>{isApproving ? 'Approving...' : 'Approve & Seal Draft'}</span>
          </button>
        )}
      </div>
    </section>
  );
}
