import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard, PumpControl, AlertsPanel, Toasts } from "../components/Cards.jsx";
import { HistoryLine, WaterBar } from "../components/Charts.jsx";
import { nowLabel, nextSensorTick, computeAlerts, clamp, fmtPct, fmtTemp } from "../utils/mock.js";
import { outsideLightNow, targetIndoorLightFor } from "../utils/atmo.js";
import { useTheme } from "../hooks/useTheme.js";

function Navbar({ user, onLogout, dark, onToggleTheme }) {
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top sg-animate">
      <div className="container-fluid">
        <a className="navbar-brand fw-semibold text-success" href="#">🌿 Smart Garden</a>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <a className="btn btn-sm btn-outline-secondary" href="/device-setup">Device Setup</a>
          <button className="btn btn-sm btn-outline-dark" onClick={onToggleTheme}>{dark ? "Light Mode" : "Dark Mode"}</button>
          {user && <span className="text-muted small">Hello, {user.name}</span>}
          {user && <button className="btn btn-outline-secondary btn-sm" onClick={onLogout}>Sign out</button>}
        </div>
      </div>
    </nav>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("sg_user") || "null"));
  useEffect(() => { if (!user) nav("/login"); }, [user]);

  const [dark, toggleTheme] = useTheme(); // << one hook controls EVERYTHING

  // Plants list
  const [plants, setPlants] = useState(() => JSON.parse(localStorage.getItem("sg_plants") || "[]"));
  useEffect(() => localStorage.setItem("sg_plants", JSON.stringify(plants)), [plants]);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = (msg, variant = "bg-success") => setToasts(t => [...t, { id: crypto.randomUUID(), msg, variant }]);
  const closeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // Realtime series
  const [labels, setLabels] = useState(() => Array.from({ length: 10 }, () => nowLabel()));
  const [series, setSeries] = useState({ soil: Array(10).fill(60), light: Array(10).fill(50), temp: Array(10).fill(22), humidity: Array(10).fill(60) });
  const [current, setCurrent] = useState({ soil: 60, light: 50, temp: 22, humidity: 60, water: 80 });
  const [waterHistory, setWaterHistory] = useState(Array(10).fill(80));
  const [pumpOn, setPumpOn] = useState(false);

  const alerts = useMemo(() => computeAlerts({ soil: current.soil, water: current.water }), [current]);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => {
        let t = nextSensorTick(c);
        if (pumpOn) t = { ...t, soil: clamp(t.soil + 3, 0, 100), water: clamp(t.water - 2, 0, 100) };
        setLabels(prev => [...prev.slice(-9), nowLabel()]);
        setSeries(prev => ({
          soil: [...prev.soil.slice(-9), t.soil],
          light: [...prev.light.slice(-9), t.light],
          temp: [...prev.temp.slice(-9), t.temp],
          humidity: [...prev.humidity.slice(-9), t.humidity],
        }));
        setWaterHistory(prev => [...prev.slice(-9), t.water]);
        return t;
      });
    }, 6000);
    return () => clearInterval(id);
  }, [pumpOn]);

  // Actions
  const waterNow = () => {
    setCurrent(c => ({ ...c, soil: clamp(c.soil + 15, 0, 100), water: clamp(c.water - 5, 0, 100) }));
    pushToast("Manual watering started for 20s");
  };

  const balanceLightingGlobal = () => {
    const outside = outsideLightNow();
    const target = targetIndoorLightFor(outside, "Global");
    setCurrent(c => ({ ...c, light: clamp(Math.round(target), 0, 100) }));
    pushToast(`Lights balanced to ${Math.round(target)}% (outside ${outside}%)`);
  };

  const addPlant = () => {
    const name = prompt("Plant name (e.g., Monstera):");
    if (!name) return;
    setPlants(arr => [...arr, { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() }]);
    pushToast(`Added plant: ${name}`);
  };

  const onLogout = () => { localStorage.removeItem("sg_user"); nav("/login"); };

  return (
    <>
      <Navbar user={user} onLogout={onLogout} dark={dark} onToggleTheme={toggleTheme} />
      <Toasts toasts={toasts} onClose={closeToast} />

      <div className="container my-4 sg-animate-slow">
        {/* Action Bar */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <button className="btn btn-success" onClick={waterNow}>Water Now</button>
          <button className="btn btn-outline-success" onClick={balanceLightingGlobal}>Adjust Lighting</button>
          <button className="btn btn-outline-secondary" onClick={addPlant}>Add Plant</button>
          <button className="btn btn-outline-dark" onClick={toggleTheme}>{dark ? "Light Mode" : "Dark Mode"}</button>
          <span className="badge text-bg-success ms-auto">Healthy 3</span>
          <span className="badge text-bg-secondary">Sensors 7</span>
          <span className="badge text-bg-warning">Alerts {alerts.length}</span>
        </div>

        {/* Stats */}
        <div className="row g-3">
          <div className="col-md-3"><StatCard title="Soil Moisture" value={current.soil} unit="%" icon="🌱" className="hover-lift sg-animate" /></div>
          <div className="col-md-3"><StatCard title="Light" value={current.light} unit="%" icon="☀️" variant="warning" className="hover-lift sg-animate" /></div>
          <div className="col-md-3"><StatCard title="Temperature" value={current.temp} unit="°C" icon="🌡️" variant="info" className="hover-lift sg-animate" /></div>
          <div className="col-md-3"><StatCard title="Humidity" value={current.humidity} unit="%" icon="💧" variant="secondary" className="hover-lift sg-animate" /></div>
        </div>

        {/* Charts + Controls */}
        <div className="row g-3 mt-1">
          <div className="col-lg-8">
            <div className="card sg border-0 p-3 hover-lift sg-animate">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="fw-semibold">History (Line)</div>
                <div className="text-muted small">auto refresh 6s</div>
              </div>
              <HistoryLine labels={labels} series={series} dark={dark} />
            </div>
          </div>
          <div className="col-lg-4">
            <PumpControl isOn={pumpOn} onToggle={() => { setPumpOn(v=>!v); pushToast(`Pump ${!pumpOn ? "ON" : "OFF"}`); }} />
            <div className="mt-3"><AlertsPanel items={alerts} /></div>
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12">
            <div className="card sg p-3 border-0 hover-lift sg-animate">
              <div className="fw-semibold mb-2">Water Level (Bar)</div>
              <WaterBar labels={labels} values={waterHistory} dark={dark} />
            </div>
          </div>
        </div>

        {/* Plants & Activity */}
        <div className="row g-3 mt-1">
          <div className="col-12">
            <div className="card sg p-3 border-0 hover-lift sg-animate">
              <div className="fw-semibold mb-2">My Plants</div>
              {plants.length === 0 && <div className="text-muted">No plants yet. Click <span className="text-decoration-underline" role="button" onClick={addPlant}>Add Plant</span>.</div>}
              <div className="d-flex flex-wrap gap-2">
                {plants.map(p => (
                  <div key={p.id} className="badge text-bg-light border">
                    {p.name}
                    <span className="ms-2 text-muted small">added {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card sg p-3 border-0 hover-lift sg-animate">
              <div className="fw-semibold mb-2">Recent Snapshot</div>
              <ul className="text-muted small mb-0">
                <li>Moisture: {fmtPct(current.soil)} | Light: {fmtPct(current.light)} | Humidity: {fmtPct(current.humidity)} | Temp: {fmtTemp(current.temp)}</li>
                <li>Water level: {fmtPct(current.water)}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
