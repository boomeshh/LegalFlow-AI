'use client';

/**
 * AuthGuard — Wraps page content and redirects to /login if not authenticated.
 * Shows a loading state while auth is being restored from localStorage.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

export default function AuthGuard({ children, permission = null }) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  // Optional permission check — shows an access-denied message inline
  if (permission && !hasPermission(permission)) {
    return (
      <div className="notice warning" style={{ marginTop: '32px' }}>
        <strong>Access Restricted:</strong> Your role ({user.role}) does not have permission to view this section.
      </div>
    );
  }

  return children;
}
