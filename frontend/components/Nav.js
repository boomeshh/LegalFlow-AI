'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { ScalesIcon, CourthouseIcon, BriefcaseIcon, DocumentIcon, ShieldCheckIcon, GavelIcon, UserIcon } from './Icons';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const links = [
    { href: '/', label: 'Dashboard', icon: CourthouseIcon },
    { href: '/cases', label: 'Cases', icon: BriefcaseIcon },
    { href: '/tasks', label: 'Tasks', icon: GavelIcon },
    { href: '/documents', label: 'Documents & AI', icon: DocumentIcon },
    { href: '/validation', label: 'Feedback', icon: ShieldCheckIcon },
  ];

  function handleSignOut() {
    signOut();
    router.push('/login');
  }

  return (
    <header className="topbar">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <div className="brand-seal">
            <ScalesIcon size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-title">LegalFlow AI</span>
            <span className="brand-subtitle">Court Workflow System</span>
          </div>
        </Link>

        <nav className="nav-links">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-item-icon" size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <UserIcon size={14} />
                <span style={{ fontWeight: '600', color: 'var(--navy-900)' }}>{user.display_name}</span>
                <span className="badge info" style={{ fontSize: '10.5px', padding: '2px 7px' }}>{user.role}</span>
              </div>
              <button
                className="secondary"
                style={{ padding: '5px 12px', fontSize: '12px' }}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="gold" style={{ padding: '5px 14px', fontSize: '12px' }}>
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
