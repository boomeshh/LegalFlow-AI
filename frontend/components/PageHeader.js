import Link from 'next/link';

export default function PageHeader({ eyebrow, title, subtitle, breadcrumbs = [], action }) {
  return (
    <header className="page-header">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Dashboard</Link>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="sep">/</span>
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span className="current">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>

      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}
