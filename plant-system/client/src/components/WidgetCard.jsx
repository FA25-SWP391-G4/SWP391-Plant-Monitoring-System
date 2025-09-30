export default function WidgetCard({ title, subtitle, right, children }) {
  return (
    <div className="sf-card">
      <div className="sf-card-header">
        <div>
          <div style={{fontWeight:700}}>{title}</div>
          {subtitle && <div className="sf-muted" style={{fontSize:12}}>{subtitle}</div>}
        </div>
        <div>{right}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}
