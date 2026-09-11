'use client';

import { useEffect, useState } from 'react';
import { fetchDocuments, fetchDocument, createDocument, searchAIDocuments, summarizeAIDocument, fetchCases } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { DocumentIcon, PlusIcon, SearchIcon, SparklesIcon, CalendarIcon, CloseIcon, ShieldCheckIcon } from '../../components/Icons';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [newDoc, setNewDoc] = useState({
    case_id: '',
    name: '',
    doc_type: 'Case Note',
    content: '',
  });

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      const c = await fetchCases();
      setCases(c);
      if (c.length > 0 && !newDoc.case_id) {
        setNewDoc((prev) => ({ ...prev, case_id: c[0].id }));
      }
    } catch (e) {
      setMessage('Failed to load documents.');
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    setMessage('Searching synthetic demo documents...');
    try {
      const res = await searchAIDocuments(query);
      setSearchResults(res);
      setMessage(`Found ${res.results.length} matching document(s).`);
    } catch (e) {
      setMessage(`Search error: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSummarize(docId) {
    setIsSummarizing(true);
    setMessage('Generating AI document summary...');
    try {
      const res = await summarizeAIDocument(docId);
      setSummaryResult(res);
      setMessage('AI Summary generated successfully.');
    } catch (e) {
      setMessage(`Error generating summary: ${e.message}`);
    } finally {
      setIsSummarizing(false);
    }
  }

  async function handleViewDocument(docId) {
    try {
      const doc = await fetchDocument(docId);
      setSelectedDoc(doc);
    } catch (e) {
      setMessage(`Error fetching document: ${e.message}`);
    }
  }

  async function handleUploadDoc(e) {
    e.preventDefault();
    try {
      await createDocument({ ...newDoc, case_id: parseInt(newDoc.case_id) });
      setMessage(`Document "${newDoc.name}" uploaded successfully!`);
      setIsUploading(false);
      setNewDoc({
        case_id: cases[0]?.id || '',
        name: '',
        doc_type: 'Case Note',
        content: '',
      });
      loadDocuments();
    } catch (e) {
      setMessage(`Error uploading: ${e.message}`);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Documents & AI' }]}
        eyebrow="DOCUMENT INTELLIGENCE & SEARCH"
        title="Documents & AI Assistant"
        subtitle="Search indexed case documents by legal context, inspect full filings, and request automated AI summaries."
        action={
          <button onClick={() => setIsUploading(true)}>
            <PlusIcon size={16} />
            <span>Upload Demo Document</span>
          </button>
        }
      />

      {message && <div className="notice info">{message}</div>}

      {/* AI SEARCH FORM */}
      <form onSubmit={handleSearch} className="card" style={{ marginBottom: '28px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <SearchIcon size={18} style={{ position: 'absolute', left: '14px', color: 'var(--gold-600)' }} />
            <input
              type="text"
              placeholder="Search case documents by keyword or legal context (e.g. notice clause, payment, filing order)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>
          <button type="submit" className="gold" disabled={isSearching} style={{ flexShrink: 0 }}>
            <SparklesIcon size={16} />
            <span>{isSearching ? 'Searching...' : 'AI Search'}</span>
          </button>
        </div>
      </form>

      {/* AI SEARCH RESULTS */}
      {searchResults && (
        <section className="card" style={{ marginBottom: '28px' }}>
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SparklesIcon size={20} style={{ color: 'var(--gold-600)' }} />
              <h2>AI Search Results</h2>
            </div>
            <span className="badge info">{searchResults.notice}</span>
          </div>

          {searchResults.results.length === 0 ? (
            <EmptyState
              title="No Documents Found"
              description="No matching demo documents found for your search query."
            />
          ) : (
            <div className="grid two">
              {searchResults.results.map((r) => (
                <div key={r.document_id} className="result-box" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span className="badge gold" style={{ fontSize: '11px', marginBottom: '4px' }}>{r.case_code}</span>
                      <strong style={{ fontSize: '15px', color: 'var(--navy-950)', display: 'block' }}>{r.name}</strong>
                    </div>
                    <span className="badge info">Relevance: {r.score}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.6' }}>
                    {r.preview}
                  </p>
                  <button
                    className="secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => handleViewDocument(r.document_id)}
                  >
                    <DocumentIcon size={14} />
                    <span>View Document</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* AI SUMMARY DISPLAY */}
      {summaryResult && (
        <section className="review-box" style={{ marginBottom: '28px' }}>
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SparklesIcon size={20} style={{ color: 'var(--gold-600)' }} />
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>AI GENERATED SUMMARY</p>
                <h2>Document: {summaryResult.document}</h2>
              </div>
            </div>
            <button className="secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSummaryResult(null)}>
              <CloseIcon size={14} /> Close
            </button>
          </div>

          <div className="result-box">{summaryResult.summary}</div>

          <div className="notice warning" style={{ margin: 0, fontSize: '12.5px' }}>
            <ShieldCheckIcon size={16} />
            <div>{summaryResult.notice}</div>
          </div>
        </section>
      )}

      {/* DOCUMENT LIBRARY GRID */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--navy-950)' }}>
          Indexed Document Library ({documents.length})
        </h2>
      </div>

      <div className="grid three">
        {documents.map((d) => (
          <article className="card" key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="card-head" style={{ marginBottom: '12px' }}>
                <span className="badge info">{d.doc_type}</span>
                <strong style={{ color: 'var(--gold-700)', fontFamily: 'var(--font-serif)', fontSize: '14px' }}>
                  {d.case_code}
                </strong>
              </div>

              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: '700', marginBottom: '8px', color: 'var(--navy-950)' }}>
                {d.name}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                <CalendarIcon size={13} />
                <span>Uploaded: {d.uploaded_at}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="secondary" style={{ flex: 1, fontSize: '12px', padding: '8px 10px' }} onClick={() => handleViewDocument(d.id)}>
                <DocumentIcon size={14} />
                <span>Read Text</span>
              </button>
              <button className="gold" style={{ flex: 1, fontSize: '12px', padding: '8px 10px' }} disabled={isSummarizing} onClick={() => handleSummarize(d.id)}>
                <SparklesIcon size={14} />
                <span>AI Summary</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* VIEW DOCUMENT TEXT MODAL */}
      {selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="card-head">
              <div>
                <p className="eyebrow">{selectedDoc.case_code} · {selectedDoc.doc_type}</p>
                <h2 style={{ fontSize: '20px' }}>{selectedDoc.name}</h2>
              </div>
              <button className="secondary" style={{ padding: '6px' }} onClick={() => setSelectedDoc(null)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="result-box" style={{ maxHeight: '380px', overflowY: 'auto', margin: '18px 0' }}>
              {selectedDoc.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary" onClick={() => setSelectedDoc(null)}>
                Close
              </button>
              <button className="gold" onClick={() => { handleSummarize(selectedDoc.id); setSelectedDoc(null); }}>
                <SparklesIcon size={14} />
                Summarize with AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploading && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DocumentIcon size={20} style={{ color: 'var(--gold-600)' }} />
                <h2>Upload Demo Document</h2>
              </div>
              <button className="secondary" style={{ padding: '6px' }} onClick={() => setIsUploading(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <label>
                <span className="form-label-text">Target Case</span>
                <select
                  value={newDoc.case_id}
                  onChange={(e) => setNewDoc({ ...newDoc, case_id: e.target.value })}
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_code} — {c.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="form-label-text">File Name</span>
                <input
                  required
                  placeholder="e.g. witness_statement_v1.txt"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                />
              </label>

              <label>
                <span className="form-label-text">Document Type</span>
                <select
                  value={newDoc.doc_type}
                  onChange={(e) => setNewDoc({ ...newDoc, doc_type: e.target.value })}
                >
                  <option value="Case Note">Case Note</option>
                  <option value="Agreement">Agreement</option>
                  <option value="Checklist">Checklist</option>
                  <option value="Affidavit">Affidavit</option>
                  <option value="Court Notice">Court Notice</option>
                </select>
              </label>

              <label>
                <span className="form-label-text">Synthetic Content Text</span>
                <textarea
                  required
                  rows={5}
                  placeholder="Enter sample demo text content..."
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="secondary" onClick={() => setIsUploading(false)}>
                  Cancel
                </button>
                <button type="submit" className="gold">
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
