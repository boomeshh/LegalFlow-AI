'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import { GavelIcon, PlusIcon, SparklesIcon, FilterIcon, CalendarIcon, UserIcon, CheckIcon, CloseIcon } from '../../components/Icons';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [message, setMessage] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [isCreating, setIsCreating] = useState(false);

  const [newTask, setNewTask] = useState({
    case_id: '',
    title: '',
    assignee: 'Junior Advocate',
    due_date: '',
    priority: 'Medium',
  });

  const loadTasks = async () => {
    try {
      const data = await getJSON('/tasks');
      setTasks(data);
      const c = await getJSON('/cases');
      setCases(c);
      if (c.length > 0 && !newTask.case_id) {
        setNewTask((prev) => ({ ...prev, case_id: c[0].id }));
      }
    } catch (e) {
      setMessage('Failed to load tasks from backend.');
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  async function setTaskStatus(id, newStatus) {
    try {
      await sendJSON(`/tasks/${id}`, 'PATCH', { status: newStatus });
      setMessage(`Task status updated to ${newStatus}.`);
      loadTasks();
    } catch (e) {
      setMessage(`Error: ${e.message}`);
    }
  }

  async function getPrioritySuggestion(taskId) {
    try {
      const res = await getJSON(`/ai/task-priority/${taskId}`);
      setSuggestion({ taskId, ...res });
    } catch (e) {
      setMessage(`Error: ${e.message}`);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    try {
      await sendJSON('/tasks', 'POST', { ...newTask, case_id: parseInt(newTask.case_id) });
      setMessage('New task created successfully!');
      setIsCreating(false);
      setNewTask({
        case_id: cases[0]?.id || '',
        title: '',
        assignee: 'Junior Advocate',
        due_date: '',
        priority: 'Medium',
      });
      loadTasks();
    } catch (e) {
      setMessage(`Error creating task: ${e.message}`);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee === 'All') return true;
    return t.assignee === filterAssignee;
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Tasks' }]}
        eyebrow="TASK TRACKING & DELEGATION"
        title="Advocate & Junior Tasks"
        subtitle="Manage workflow assignments, track deadlines, filter by team roles, and receive AI task priority guidance."
        action={
          <button onClick={() => setIsCreating(true)}>
            <PlusIcon size={16} />
            <span>Assign New Task</span>
          </button>
        }
      />

      {message && <div className="notice info">{message}</div>}

      {/* AI PRIORITY SUGGESTION DISPLAY */}
      {suggestion && (
        <div className="notice warning" style={{ marginBottom: '24px' }}>
          <SparklesIcon size={20} style={{ color: 'var(--gold-600)', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              AI Priority Recommendation for Task #{suggestion.taskId}:
            </strong>
            <div style={{ marginBottom: '6px' }}>
              Suggested Priority: <span className="badge high" style={{ marginLeft: '6px' }}>{suggestion.suggested_priority}</span>
            </div>
            <p style={{ fontSize: '13px', margin: '4px 0' }}>Reason: {suggestion.reason}</p>
            <small style={{ opacity: 0.8, fontSize: '11.5px' }}>{suggestion.notice}</small>
          </div>
        </div>
      )}

      {/* FILTER BUTTONS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <FilterIcon size={16} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Filter Assignee:</span>
        {['All', 'Senior Advocate', 'Junior Advocate'].map((role) => (
          <button
            key={role}
            className={filterAssignee === role ? 'gold' : 'secondary'}
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
            onClick={() => setFilterAssignee(role)}
          >
            {role === 'All' ? 'All Assignments' : role}
          </button>
        ))}
      </div>

      {/* TASKS TABLE */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case Code</th>
              <th>Task Title</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                  No tasks found for this filter.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong style={{ color: 'var(--gold-700)', fontFamily: 'var(--font-serif)' }}>
                      {t.case_code}
                    </strong>
                  </td>
                  <td><strong style={{ color: 'var(--navy-950)' }}>{t.title}</strong></td>
                  <td><span className="badge">{t.assignee}</span></td>
                  <td>{t.due_date || 'None'}</td>
                  <td>
                    <span className={`badge ${t.priority.toLowerCase()}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'Done' ? 'done' : t.status === 'In Progress' ? 'in-progress' : 'pending'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="secondary"
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => getPrioritySuggestion(t.id)}
                    >
                      <SparklesIcon size={12} style={{ color: 'var(--gold-600)' }} />
                      <span>AI Priority</span>
                    </button>
                    <button
                      className={t.status === 'Done' ? 'secondary' : 'success'}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => setTaskStatus(t.id, t.status === 'Done' ? 'Pending' : 'Done')}
                    >
                      <CheckIcon size={12} />
                      <span>{t.status === 'Done' ? 'Reopen' : 'Mark Done'}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE TASK MODAL */}
      {isCreating && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GavelIcon size={20} style={{ color: 'var(--gold-600)' }} />
                <h2>Assign New Task</h2>
              </div>
              <button className="secondary" style={{ padding: '6px' }} onClick={() => setIsCreating(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <label>
                <span className="form-label-text">Target Case</span>
                <select
                  value={newTask.case_id}
                  onChange={(e) => setNewTask({ ...newTask, case_id: e.target.value })}
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_code} — {c.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="form-label-text">Task Title</span>
                <input
                  required
                  placeholder="e.g. Verify witness affidavit list"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </label>

              <label>
                <span className="form-label-text">Assignee Role</span>
                <select
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                >
                  <option value="Junior Advocate">Junior Advocate</option>
                  <option value="Senior Advocate">Senior Advocate</option>
                  <option value="Legal Clerk">Legal Clerk</option>
                </select>
              </label>

              <label>
                <span className="form-label-text">Due Date</span>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </label>

              <label>
                <span className="form-label-text">Priority</span>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="secondary" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="gold">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
