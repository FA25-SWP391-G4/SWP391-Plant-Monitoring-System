import React from "react";

/* ---------- Shared wrappers ---------- */
export function Toasts({ toasts, onClose }) {
  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast align-items-center show mb-2 ${t.variant||''}`} role="alert">
          <div className="d-flex">
            <div className="toast-body">{t.msg}</div>
            <button className="btn-close btn-close-white me-2 m-auto" onClick={()=>onClose(t.id)}></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Stat Card ---------- */
export function StatCard({ title, value, unit="", icon="🌿", variant="success", className="" }) {
  return (
    <div className={`card sg border-0 p-3 hover-lift sg-animate ${className}`}>
      <div className="d-flex align-items-center justify-content-between">
        <div className="text-muted small">{title}</div>
        <div className="icon-circle">{icon}</div>
      </div>
      <div className="d-flex align-items-end gap-2 mt-2">
        <div className="h3 mb-0" style={{ fontWeight: 800 }}>{Number.isFinite(value)?value:0}{unit}</div>
      </div>
    </div>
  );
}

/* ---------- Pump Control ---------- */
export function PumpControl({ isOn, onToggle }) {
  return (
    <div className="card sg p-3 border-0 hover-lift sg-animate">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <div className="fw-semibold">Pump Control</div>
          <div className="text-muted small">Manual override</div>
        </div>
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" role="switch" checked={isOn} onChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Alerts Panel ---------- */
export function AlertsPanel({ items=[] }) {
  return (
    <div className="card sg p-3 border-0 hover-lift sg-animate">
      <div className="fw-semibold mb-2">Alerts</div>
      {items.length === 0 ? (
        <div className="text-muted small">All good — no alerts.</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {items.map((a,idx)=>(
            <div key={idx} className="alert soft py-2 px-3 mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <div>
                <div className="fw-semibold">{a.title}</div>
                {a.detail && <div className="small">{a.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
