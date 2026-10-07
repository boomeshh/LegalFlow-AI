'use client';

/**
 * AuthContext.js — Simple demo auth context for LegalFlow AI.
 *
 * Stores JWT token + user info in localStorage.
 * Role is used to show/hide UI elements (not a security boundary — demo only).
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, fetchCurrentUser } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { username, role, display_name, permissions }
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('legalflow_token');
    if (token) {
      fetchCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('legalflow_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    localStorage.setItem('legalflow_token', data.access_token);
    const me = await fetchCurrentUser();
    setUser(me);
    return me;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('legalflow_token');
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (perm) => user?.permissions?.includes(perm) ?? false,
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
