'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../../lib/api';

const initialForm = {
  tester_role: '',
  task_tested: '',
  what_worked: '',
  confusing: '',
  improvement: '',
  final_feedback: '',
};

export default function ValidationPage() {
  const [form, setForm] = useState(initialForm);
  const [feedbackList, setFeedbackList] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFeedback = async () => {
    try {
      const data = await getJSON('/validation');
      setFeedbackList(data);
    } catch (e) {
      setMessage('Failed to load recorded feedback.');
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      await sendJSON('/validation', 'POST', form);
      setMessage('Tester feedback saved successfully to database!');
      setForm(initialForm);
      loadFeedback();
    } catch (e) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="card-head" style={{ marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">FEEDBACK & EVALUATION</p>
          <h1>User Feedback</h1>
        </div>
      </div>

      <div className="notice info" style={{ marginBottom: '24px' }}>
        <strong>User Evaluation:</strong> We welcome feedback from legal professionals, advocates, and team members evaluating the platform. Please submit your observations below.
      </div>

      {message && <div className="notice info">{message}</div>}

      {/* FEEDBACK FORM */}
      <section className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Record Evaluation</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <label>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Role</span>
            <input
              required
              placeholder="e.g. Senior Advocate / Junior Advocate / Legal Clerk / Reviewer"
              value={form.tester_role}
              onChange={(e) => setForm({ ...form, tester_role: e.target.value })}
            />
          </label>

          <label>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Task Tested</span>
            <input
              required
              placeholder="e.g. Case drafting & advocate review flow, AI document search"
              value={form.task_tested}
              onChange={(e) => setForm({ ...form, task_tested: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>What Worked Well?</span>
            <textarea
              required
              rows={2}
              placeholder="Describe aspects of the workflow assistant that functioned effectively..."
              value={form.what_worked}
              onChange={(e) => setForm({ ...form, what_worked: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>What Was Confusing or Unclear?</span>
            <textarea
              required
              rows={2}
              placeholder="Describe any confusing steps, labels, or navigation friction..."
              value={form.confusing}
              onChange={(e) => setForm({ ...form, confusing: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Suggested Improvements</span>
            <textarea
              required
              rows={2}
              placeholder="Describe features or UX changes recommended..."
              value={form.improvement}
              onChange={(e) => setForm({ ...form, improvement: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Final Overall Feedback</span>
            <textarea
              required
              rows={2}
              placeholder="Overall evaluation rating or summary comments..."
              value={form.final_feedback}
              onChange={(e) => setForm({ ...form, final_feedback: e.target.value })}
            />
          </label>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Feedback...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </section>

      {/* RECORDED FEEDBACK TABLE */}
      <section className="card">
        <div className="card-head" style={{ marginBottom: '16px' }}>
          <h2>Recorded Feedback ({feedbackList.length})</h2>
          <span className="badge info">Live Database Records</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Role</th>
                <th>Task Tested</th>
                <th>What Worked</th>
                <th>What Was Confusing</th>
                <th>Suggested Improvement</th>
                <th>Final Feedback</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No feedback recorded yet.
                  </td>
                </tr>
              ) : (
                feedbackList.map((item, index) => (
                  <tr key={item.id}>
                    <td><strong>{index + 1}</strong></td>
                    <td><span className="badge info">{item.tester_role}</span></td>
                    <td><strong>{item.task_tested}</strong></td>
                    <td style={{ fontSize: '13px' }}>{item.what_worked}</td>
                    <td style={{ fontSize: '13px', color: '#fca5a5' }}>{item.confusing}</td>
                    <td style={{ fontSize: '13px', color: '#fde047' }}>{item.improvement}</td>
                    <td style={{ fontSize: '13px' }}>{item.final_feedback}</td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{item.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
