'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/cases', label: 'Cases' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/documents', label: 'Documents + AI' },
    { href: '/validation', label: 'Feedback' },
  ];

  return (
    <header className="topbar">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <div className="brand-icon">L</div>
          <span>LegalFlow AI</span>
        </Link>

        <nav className="nav-links">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="principle-badge">
          <span>AI Suggests → Advocate Approves</span>
        </div>
      </div>
    </header>
  );
}
