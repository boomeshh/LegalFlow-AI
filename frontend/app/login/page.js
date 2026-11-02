'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { ScalesIcon, ShieldCheckIcon } from '../../components/Icons';

const DEMO_USERS = [
  { username: 'senior_advocate', label: 'Senior Advocate', description: 'Full access — cases, tasks, documents, drafts, AI' },
  { username: 'junior_advocate', label: 'Junior Advocate', description: 'Tasks, case & document read, AI search/summary' },
  { username: 'client', label: 'Client', description: 'Read-only case status & dashboard' },
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(username, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(uname) {
    setUsername(uname);
    setPassword('demo123');
    setError('');
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'var(--gold-100)', marginBottom: '12px',
          }}>
            <ScalesIcon size={28} style={{ color: 'var(--gold-700)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--navy-950)', marginBottom: '6px' }}>
            LegalFlow AI
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Demo Authentication — Review 2</p>
        </div>

        {/* Login form */}
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label>
              <span className="form-label-text">Demo Username</span>
              <input
                required
                placeholder="e.g. senior_advocate"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <label>
              <span className="form-label-text">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <div className="notice warning" style={{ margin: 0 }}>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="gold" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick-login shortcuts */}
        <div className="card" style={{ marginTop: '16px', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Quick Demo Login
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                className="secondary"
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px', padding: '10px 14px' }}
                onClick={() => quickLogin(u.username)}
              >
                <span style={{ fontWeight: '700', fontSize: '13px' }}>{u.label}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '400' }}>{u.description}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
            All demo passwords are: <strong>demo123</strong>
          </p>
        </div>

        {/* Notice */}
        <div className="notice info" style={{ marginTop: '16px', fontSize: '12px' }}>
          <ShieldCheckIcon size={14} />
          <span>Demo-only authentication. No real credentials are stored.</span>
        </div>

      </div>
    </div>
  );
}
