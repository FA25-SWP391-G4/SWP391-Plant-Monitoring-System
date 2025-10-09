import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard, PumpControl, AlertsPanel, Toasts } from "../components/Cards.jsx";
import { HistoryLine, WaterBar } from "../components/Charts.jsx";
import ChatBox from "../components/ChatBox.jsx";
import { ParamRadar, exportCsv } from "../components/PremiumCharts.jsx";
import { outsideLightNow, targetIndoorLightFor } from "../utils/atmo.js";
import { clamp } from "../utils/store.js";
import { useTheme } from "../hooks/useTheme.js";

const nowLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmtPct = (n) => `${n.toFixed(0)}%`;
const fmtTemp = (n) => `${n.toFixed(1)}°C`;

function Navbar({ user, dark, onToggleTheme, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top sg-animate">
      <div className="container-fluid">
        <a className="navbar-brand fw-semibold text-success" href="#">🌿 Smart Garden — Premium</a>
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

export default function PremiumDashboard() {
  const nav = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("sg_user") || "{}"));
  useEffect(() => { if (!user?.role) nav("/login"); }, []);

  const [dark, toggleTheme] = useTheme();

  // Toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = (msg, variant = "bg-success") => setToasts(t => [...t, { id: crypto.randomUUID(), msg, variant }]);
  const closeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  // Plants
  const [plants, setPlants] = useState([
    { id:"1", title:"Monstera", moisture:60, light:58, temp:22, humidity:60, icon:"🌿", status:"Good", lastWatered:"", nextAction:"Rotate tomorrow" },
    { id:"2", title:"Fiddle Leaf Fig", moisture:28, light:63, temp:23, humidity:42, icon:"🪴", status:"Needs", lastWatered:"", nextAction:"Water today" },
    { id:"3", title:"Rosemary", moisture:45, light:89, temp:26, humidity:39, icon:"🌿", status:"Needs", lastWatered:"", nextAction:"Reduce light" },
  ]);
  const [selectedPlantId, setSelectedPlantId] = useState("1");

  // Realtime series
  const [labels, setLabels] = useState(() => Array.from({ length: 10 }, () => nowLabel()));
  const [series, setSeries] = useState({ soil: Array(10).fill(60), light: Array(10).fill(50), temp: Array(10).fill(22), humidity: Array(10).fill(60) });
  const [current, setCurrent] = useState({ soil: 60, light: 50, temp: 22, humidity: 60, water: 80 });
  const [waterHistory, setWaterHistory] = useState(Array(10).fill(80));
  const [pumpOn, setPumpOn] = useState(false);

  const alerts = useMemo(() => {
    const arr = [];
    if (current.soil < 30) arr.push({ type: "warning", title: "Soil dry", detail: "Soil moisture < 30% — consider watering." });
    if (current.water < 15) arr.push({ type: "danger", title: "Low water level", detail: "Reservoir under 15% — refill soon." });
    if (plants.find(p => p.light > 85 && /rosemary/i.test(p.title))) arr.push({ type:"warning", title:"Rosemary too bright", detail:"Move to partial shade." });
    return arr;
  }, [current, plants]);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => {
        const j = (x, step = 2, min = 0, max = 100) => Math.max(min, Math.min(max, +(x + (Math.random()*2-1)*step).toFixed(1)));
        let t = { soil:j(c.soil,4), light:j(c.light,6), temp:+(c.temp+(Math.random()*2-1)*0.4).toFixed(1), humidity:j(c.humidity,2,15,95), water:+(c.water-Math.random()*0.8).toFixed(1) };
        if (pumpOn) t = { ...t, soil: clamp(t.soil + 3, 0, 100), water: clamp(t.water - 2, 0, 100) };

        setLabels(prev => [...prev.slice(-9), nowLabel()]);
        setSeries(prev => ({
          soil: [...prev.soil.slice(-9), t.soil],
          light: [...prev.light.slice(-9), t.light],
          temp: [...prev.temp.slice(-9), t.temp],
          humidity: [...prev.humidity.slice(-9), t.humidity],
        }));
        setWaterHistory(prev => [...prev.slice(-9), t.water]);

        setPlants(prev => prev.map(p => ({
          ...p,
          moisture: clamp(p.moisture + (Math.random()*2-1)*1.5 + (pumpOn ? 0.6 : 0), 0, 100),
          humidity: clamp(p.humidity + (Math.random()*2-1)*1.2, 15, 95),
        })));

        return t;
      });
    }, 6000);
    return () => clearInterval(id);
  }, [pumpOn]);

  // Actions
  const waterNow = () => {
    setCurrent(c => ({ ...c, soil: clamp(c.soil + 15, 0, 100), water: clamp(c.water - 5, 0, 100) }));
    setPlants(prev => prev.map(p => p.id===selectedPlantId ? { ...p, moisture: clamp(p.moisture+15,0,100), lastWatered: new Date().toLocaleString(), status:'Good', nextAction:'Water in 2 days' } : p));
    pushToast("Manual watering started for 20s");
  };

  const balanceLighting = () => {
    const outside = outsideLightNow();
    setPlants(prev => prev.map(p => {
      const target = targetIndoorLightFor(outside, p.title);
      const next = Math.round(clamp(p.light + (target - p.light), 0, 100));
      return { ...p, light: next, nextAction: Math.abs(target-p.light) < 1 ? "Maintain light" : next>p.light ? "Increase light" : "Reduce light" };
    }));
    setCurrent(c => ({ ...c, light: Math.round(plants.reduce((s,p)=>s+p.light,0)/Math.max(1,plants.length)) }));
    pushToast(`Lights balanced (outside=${outside}%)`);
  };

  const balancePlantLight = (id) => {
    const outside = outsideLightNow();
    setPlants(prev => prev.map(p => {
      if (p.id !== id) return p;
      const target = targetIndoorLightFor(outside, p.title);
      const next = Math.round(clamp(p.light + (target - p.light), 0, 100));
      return { ...p, light: next, nextAction: Math.abs(target-p.light) < 1 ? "Maintain light" : next>p.light ? "Increase light" : "Reduce light" };
    }));
    pushToast("Light balanced for selected plant");
  };

  const addPlant = () => {
    const name = prompt("Plant name (e.g., Monstera):"); if (!name) return;
    const p = { id: crypto.randomUUID(), title:name, moisture:60, light:60, temp:22, humidity:55, icon:"🪴", status:"Good", lastWatered:new Date().toLocaleString(), nextAction:"Water in 2 days" };
    setPlants(arr => [p, ...arr]); pushToast(`Added plant: ${name}`);
  };

  const onLogout = () => { localStorage.removeItem('sg_user'); nav('/login'); };

  const selectedPlant = plants.find(p => p.id === selectedPlantId) || plants[0];

  return (
    <>
      <Navbar user={user} dark={dark} onToggleTheme={toggleTheme} onLogout={onLogout} />
      <Toasts toasts={toasts} onClose={closeToast} />

      {/* Hero */}
      <div className="container mt-3">
        <div className="hero p-4 p-md-5 sg-animate">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1">Welcome back, {user?.name || "Premium User"}</h3>
              <div className="text-muted">Premium tools unlocked: AI chat, radar analytics, CSV export.</div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-success btn-pill" onClick={waterNow}><i className="bi bi-droplet me-2"></i>Water Now</button>
              <button className="btn btn-outline-success btn-pill" onClick={balanceLighting}><i className="bi bi-brightness-high me-2"></i>Adjust Lighting</button>
              <button className="btn btn-outline-secondary btn-pill" onClick={addPlant}><i className="bi bi-plus-circle me-2"></i>Add Plant</button>
              <button className="btn btn-outline-dark btn-pill" onClick={toggleTheme}><i className="bi bi-moon-stars me-2"></i>{dark?'Light':'Night'} Mode</button>
              <button className="btn btn-outline-success btn-pill" onClick={()=>exportCsv(labels.map((t,i)=>({time:t,soil:series.soil[i],light:series.light[i],temp:series.temp[i],humidity:series.humidity[i]})))}><i className="bi bi-file-earmark-arrow-down me-2"></i>Export CSV</button>
            </div>
          </div>
          <div className="mt-3 d-flex flex-wrap gap-2">
            <span className="chip chip-soft">Plants {plants.length}</span>
            <span className="chip chip-gray">Alerts {alerts.length}</span>
            <span className="chip chip-soft">Outside Light {outsideLightNow()}%</span>
          </div>
        </div>
      </div>

      {/* Regular features */}
      <div className="container my-3">
        <div className="row g-3">
          <div className="col-md-3"><StatCard title="Soil Moisture" value={current.soil} unit="%" icon="🌱" className="hover-lift sg-animate" /></div>
          <div className="col-md-3"><StatCard title="Light" value={current.light} unit="%" icon="☀️" variant="warning" className="hover-lift sg-animate" /></div>
          <div className="col-md-3"><StatCard title="Temperature" value={current.temp} unit="°C" icon="🌡️" variant="info" className="hover-lift sg-animate" /></div>
          <div className="col-md-3"><StatCard title="Humidity" value={current.humidity} unit="%" icon="💧" variant="secondary" className="hover-lift sg-animate" /></div>

          <div className="col-lg-8">
            <div className="card sg p-3 hover-lift sg-animate">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="fw-semibold">History (Line)</div>
                <div className="text-muted small">auto refresh 6s</div>
              </div>
              <HistoryLine labels={labels} series={series} dark={dark} />
            </div>
          </div>
          <div className="col-lg-4 sg-animate">
            <PumpControl isOn={pumpOn} onToggle={() => { setPumpOn(v=>!v); pushToast(`Pump ${!pumpOn ? 'ON' : 'OFF'}`); }} />
            <div className="mt-3"><AlertsPanel items={alerts} /></div>
          </div>

          <div className="col-12">
            <div className="card sg p-3 hover-lift sg-animate">
              <div className="fw-semibold mb-2">Water Level (Bar)</div>
              <WaterBar labels={labels} values={waterHistory} dark={dark} />
            </div>
          </div>

          {/* Premium analytics */}
          <div className="col-lg-8">
            <div className="card sg p-3 hover-lift sg-animate">
              <div className="d-flex justify-content-between align-items-center">
                <div className="fw-semibold">Plant Parameters (Radar)</div>
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm" value={selectedPlantId} onChange={(e)=>setSelectedPlantId(e.target.value)}>
                    {plants.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  <button className="btn btn-success btn-sm" onClick={()=>balancePlantLight(selectedPlantId)}><i className="bi bi-brightness-high me-1"></i>Adjust Light</button>
                </div>
              </div>
              <div className="mt-2"><ParamRadar plant={plants.find(p=>p.id===selectedPlantId) || plants[0]} dark={dark} /></div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card sg p-3 hover-lift sg-animate">
              <div className="fw-semibold mb-2"><i className="bi bi-robot me-2"></i>AI Chat</div>
              <ChatBox />
            </div>
          </div>

          <div className="col-12">
            <div className="card sg p-3 hover-lift sg-animate">
              <div className="fw-semibold mb-2">Current Snapshot</div>
              <ul className="text-muted small mb-0">
                <li>Soil: {fmtPct(current.soil)} | Light: {fmtPct(current.light)} | Humidity: {fmtPct(current.humidity)} | Temp: {fmtTemp(current.temp)}</li>
                <li>Water reservoir: {fmtPct(current.water)}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
