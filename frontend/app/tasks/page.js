'use client';

import { useEffect, useState } from 'react';
import { getJSON, sendJSON } from '../../lib/api';

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
      <div className="card-head" style={{ marginBottom: '20px' }}>
        <div>
          <p className="eyebrow">TASK TRACKING & DELEGATION</p>
          <h1>Advocate & Junior Tasks</h1>
        </div>
        <button onClick={() => setIsCreating(true)}>+ New Task Assignment</button>
      </div>

      {message && <div className="notice info">{message}</div>}

      {/* AI PRIORITY SUGGESTION DISPLAY */}
      {suggestion && (
        <div className="notice warning" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <strong>AI Priority Recommendation for Task #{suggestion.taskId}:</strong>
          <div>Suggested Priority: <span className="badge high">{suggestion.suggested_priority}</span></div>
          <p style={{ fontSize: '13px', margin: '4px 0' }}>Reason: {suggestion.reason}</p>
          <small style={{ opacity: 0.8 }}>{suggestion.notice}</small>
        </div>
      )}

      {/* FILTER BUTTONS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['All', 'Senior Advocate', 'Junior Advocate'].map((role) => (
          <button
            key={role}
            className={filterAssignee === role ? '' : 'secondary'}
            onClick={() => setFilterAssignee(role)}
          >
            {role === 'All' ? 'All Assignments' : role}
          </button>
        ))}
      </div>

      {/* TASKS TABLE */}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Task Title</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => (
              <tr key={t.id}>
                <td><strong style={{ color: 'var(--accent-light)' }}>{t.case_code}</strong></td>
                <td><strong>{t.title}</strong></td>
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
                  <button className="secondary" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => getPrioritySuggestion(t.id)}>
                    ✨ AI Priority
                  </button>
                  <button
                    className={t.status === 'Done' ? 'secondary' : 'success'}
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => setTaskStatus(t.id, t.status === 'Done' ? 'Pending' : 'Done')}
                  >
                    {t.status === 'Done' ? 'Reopen' : 'Mark Done'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE TASK MODAL */}
      {isCreating && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-head">
              <h2>Assign New Task</h2>
              <button className="secondary" onClick={() => setIsCreating(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Target Case</span>
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
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Task Title</span>
                <input
                  required
                  placeholder="e.g. Verify witness affidavit list"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Assignee Role</span>
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
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Due Date</span>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Priority</span>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="secondary" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button type="submit">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
