'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../../lib/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [newDoc, setNewDoc] = useState({
    case_id: '',
    name: '',
    doc_type: 'Case Note',
    content: '',
  });

  const loadDocuments = async () => {
    try {
      const docs = await getJSON('/documents');
      setDocuments(docs);
      const c = await getJSON('/cases');
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
    setMessage('Searching synthetic demo documents...');
    try {
      const res = await sendJSON('/ai/search', 'POST', { query });
      setSearchResults(res);
      setMessage(`Found ${res.results.length} matching document(s).`);
    } catch (e) {
      setMessage(`Search error: ${e.message}`);
    }
  }

  async function handleSummarize(docId) {
    setMessage('Generating AI document summary...');
    try {
      const res = await sendJSON('/ai/summary', 'POST', { document_id: docId });
      setSummaryResult(res);
      setMessage('AI Summary generated successfully.');
    } catch (e) {
      setMessage(`Error generating summary: ${e.message}`);
    }
  }

  async function viewDocument(docId) {
    try {
      const doc = await getJSON(`/documents/${docId}`);
      setSelectedDoc(doc);
    } catch (e) {
      setMessage(`Error fetching document: ${e.message}`);
    }
  }

  async function handleUploadDoc(e) {
    e.preventDefault();
    try {
      await sendJSON('/documents', 'POST', { ...newDoc, case_id: parseInt(newDoc.case_id) });
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
      <div className="card-head" style={{ marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">DOCUMENT INTELLIGENCE</p>
          <h1>Documents & AI Assistant</h1>
        </div>
        <button onClick={() => setIsUploading(true)}>+ Upload Demo Document</button>
      </div>

      {message && <div className="notice info">{message}</div>}

      {/* AI SEARCH FORM */}
      <form onSubmit={handleSearch} className="card" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search case documents by keyword (e.g. notice clause, payment, filing order)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">🔍 AI Search</button>
      </form>

      {/* AI SEARCH RESULTS */}
      {searchResults && (
        <section className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <h2>AI Search Results</h2>
            <span className="badge info">{searchResults.notice}</span>
          </div>
          {searchResults.results.length === 0 ? (
            <p className="lead">No matching demo documents found.</p>
          ) : (
            <div className="grid two">
              {searchResults.results.map((r) => (
                <div key={r.document_id} className="result-box" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--accent-light)' }}>{r.case_code} · {r.name}</strong>
                    <span className="badge">Relevance Score: {r.score}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.preview}</p>
                  <button
                    className="secondary"
                    style={{ marginTop: '10px', fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => viewDocument(r.document_id)}
                  >
                    View Document
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* AI SUMMARY DISPLAY */}
      {summaryResult && (
        <section className="review-box card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <div>
              <p className="eyebrow">AI GENERATED SUMMARY</p>
              <h2>Document: {summaryResult.document}</h2>
            </div>
            <button className="secondary" onClick={() => setSummaryResult(null)}>Close</button>
          </div>
          <div className="result-box">{summaryResult.summary}</div>
          <div className="notice warning" style={{ margin: 0, fontSize: '13px' }}>
            {summaryResult.notice}
          </div>
        </section>
      )}

      {/* DOCUMENT LIBRARY GRID */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Indexed Document Library</h2>
      <div className="grid three">
        {documents.map((d) => (
          <article className="card" key={d.id}>
            <div className="card-head" style={{ marginBottom: '12px' }}>
              <span className="badge info">{d.doc_type}</span>
              <strong style={{ color: 'var(--accent-light)' }}>{d.case_code}</strong>
            </div>

            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#ffffff' }}>{d.name}</h3>
            <p className="lead" style={{ fontSize: '12px', marginBottom: '16px' }}>
              Uploaded: {d.uploaded_at}
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="secondary" style={{ flex: 1, fontSize: '12px' }} onClick={() => viewDocument(d.id)}>
                📖 Read Text
              </button>
              <button style={{ flex: 1, fontSize: '12px' }} onClick={() => handleSummarize(d.id)}>
                ✨ AI Summary
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* VIEW DOCUMENT TEXT MODAL */}
      {selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="card-head">
              <div>
                <p className="eyebrow">{selectedDoc.case_code} · {selectedDoc.doc_type}</p>
                <h2>{selectedDoc.name}</h2>
              </div>
              <button className="secondary" onClick={() => setSelectedDoc(null)}>✕</button>
            </div>

            <div className="result-box" style={{ maxHeight: '350px', overflowY: 'auto', margin: '16px 0' }}>
              {selectedDoc.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="secondary" onClick={() => setSelectedDoc(null)}>Close</button>
              <button onClick={() => { handleSummarize(selectedDoc.id); setSelectedDoc(null); }}>
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
              <h2>Upload Demo Document</h2>
              <button className="secondary" onClick={() => setIsUploading(false)}>✕</button>
            </div>

            <form onSubmit={handleUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Target Case</span>
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
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>File Name</span>
                <input
                  required
                  placeholder="e.g. witness_statement_v1.txt"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Document Type</span>
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
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Synthetic Content Text</span>
                <textarea
                  required
                  rows={5}
                  placeholder="Enter sample demo text content..."
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="secondary" onClick={() => setIsUploading(false)}>
                  Cancel
                </button>
                <button type="submit">Upload Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
