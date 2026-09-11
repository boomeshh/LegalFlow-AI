export default function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="card stat-card">
      <div className="stat-icon-box">
        {Icon && <Icon size={22} />}
      </div>
      <div className="stat-info">
        <span>{label}</span>
        <strong>{value ?? '—'}</strong>
      </div>
    </article>
  );
}
