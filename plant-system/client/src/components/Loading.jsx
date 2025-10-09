export default function Loading({ label = "Loading...", fullScreen = false }) {
  if (fullScreen) {
    return (
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--sf-bg)",
          zIndex: 9999,
          gap: "16px"
        }}
      >
        <div className="spinner"></div>
        <div className="sf-muted" style={{ fontSize: "14px" }}>{label}</div>
      </div>
    );
  }

  return (
    <div className="sf-card" style={{ textAlign: "center", padding: "32px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <div className="spinner"></div>
        <div className="sf-muted">{label}</div>
      </div>
    </div>
  );
}
