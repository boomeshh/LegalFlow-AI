export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="card empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={24} />
        </div>
      )}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-desc">{description}</p>}
    </div>
  );
}
