'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScalesIcon, CourthouseIcon, BriefcaseIcon, DocumentIcon, ShieldCheckIcon, GavelIcon } from './Icons';

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: CourthouseIcon },
    { href: '/cases', label: 'Cases', icon: BriefcaseIcon },
    { href: '/tasks', label: 'Tasks', icon: GavelIcon },
    { href: '/documents', label: 'Documents & AI', icon: DocumentIcon },
    { href: '/validation', label: 'Feedback', icon: ShieldCheckIcon },
  ];

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

        <div className="principle-badge">
          <ShieldCheckIcon size={14} />
          <span>AI Suggests → Advocate Approves</span>
        </div>
      </div>
    </header>
  );
}
