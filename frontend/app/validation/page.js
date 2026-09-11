'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import { ShieldCheckIcon, UserIcon, CheckIcon, SparklesIcon, CalendarIcon } from '../../components/Icons';

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
      <PageHeader
        breadcrumbs={[{ label: 'Feedback' }]}
        eyebrow="EVALUATION & QUALITY ASSURANCE"
        title="Platform Feedback & Validation"
        subtitle="Collect structured observations, workflow assessments, and feature recommendations from advocates and legal teams."
      />

      <div className="notice info" style={{ marginBottom: '24px' }}>
        <ShieldCheckIcon size={18} />
        <div>
          <strong>Legal Professional Evaluation:</strong> We welcome structured feedback from legal advocates, senior counsel, and legal clerks evaluating this platform prototype. Please record your findings below.
        </div>
      </div>

      {message && <div className="notice success">{message}</div>}

      {/* FEEDBACK FORM */}
      <section className="card" style={{ marginBottom: '32px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <UserIcon size={20} style={{ color: 'var(--gold-600)' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--navy-950)' }}>
            Record Evaluation Observation
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <label>
            <span className="form-label-text">Role / Designation</span>
            <input
              required
              placeholder="e.g. Senior Advocate / Junior Advocate / Legal Clerk / Reviewer"
              value={form.tester_role}
              onChange={(e) => setForm({ ...form, tester_role: e.target.value })}
            />
          </label>

          <label>
            <span className="form-label-text">Task / Feature Tested</span>
            <input
              required
              placeholder="e.g. Case drafting & advocate review flow, AI document search"
              value={form.task_tested}
              onChange={(e) => setForm({ ...form, task_tested: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span className="form-label-text">What Worked Well?</span>
            <textarea
              required
              rows={2}
              placeholder="Describe aspects of the workflow assistant that functioned effectively..."
              value={form.what_worked}
              onChange={(e) => setForm({ ...form, what_worked: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span className="form-label-text">What Was Confusing or Unclear?</span>
            <textarea
              required
              rows={2}
              placeholder="Describe any confusing steps, labels, or navigation friction..."
              value={form.confusing}
              onChange={(e) => setForm({ ...form, confusing: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span className="form-label-text">Suggested Improvements</span>
            <textarea
              required
              rows={2}
              placeholder="Describe features or UX changes recommended..."
              value={form.improvement}
              onChange={(e) => setForm({ ...form, improvement: e.target.value })}
            />
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span className="form-label-text">Final Overall Feedback</span>
            <textarea
              required
              rows={2}
              placeholder="Overall evaluation rating or summary comments..."
              value={form.final_feedback}
              onChange={(e) => setForm({ ...form, final_feedback: e.target.value })}
            />
          </label>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="gold" disabled={isSubmitting}>
              <CheckIcon size={16} />
              <span>{isSubmitting ? 'Saving Feedback...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* RECORDED FEEDBACK TABLE */}
      <section className="card">
        <div className="card-head" style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheckIcon size={20} style={{ color: 'var(--gold-600)' }} />
            <h2>Recorded Feedback Log ({feedbackList.length})</h2>
          </div>
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
                <th>Date Recorded</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No feedback records found in database yet.
                  </td>
                </tr>
              ) : (
                feedbackList.map((item, index) => (
                  <tr key={item.id}>
                    <td><strong style={{ color: 'var(--gold-700)' }}>{index + 1}</strong></td>
                    <td><span className="badge info">{item.tester_role}</span></td>
                    <td><strong style={{ color: 'var(--navy-950)' }}>{item.task_tested}</strong></td>
                    <td style={{ fontSize: '13px', color: '#166534' }}>{item.what_worked}</td>
                    <td style={{ fontSize: '13px', color: '#991B1B' }}>{item.confusing}</td>
                    <td style={{ fontSize: '13px', color: '#854D0E' }}>{item.improvement}</td>
                    <td style={{ fontSize: '13px' }}>{item.final_feedback}</td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      <CalendarIcon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {item.created_at}
                    </td>
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
