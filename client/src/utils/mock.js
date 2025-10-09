export const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function nextSensorTick(prev) {
  const j = (x, step = 2, min = 0, max = 100) => clamp(+(x + (Math.random() * 2 - 1) * step).toFixed(1), min, max);
  return {
    soil: j(prev.soil, 4),
    light: j(prev.light, 6),
    temp: clamp(+(prev.temp + (Math.random() * 2 - 1) * 0.5).toFixed(1), 15, 40),
    humidity: clamp(+(prev.humidity + (Math.random() * 2 - 1) * 1.5).toFixed(1), 15, 95),
    water: clamp(+(prev.water - Math.random() * 0.8).toFixed(1), 0, 100)
  };
}

export function computeAlerts({ soil, water }) {
  const alerts = [];
  if (soil < 30) alerts.push({ type: 'warning', title: 'Soil dry', detail: 'Soil moisture is below 30% — consider watering.' });
  if (water < 15) alerts.push({ type: 'danger', title: 'Low water level', detail: 'Reservoir is under 15%. Refill soon.' });
  return alerts;
}

export const fmtPct = (n) => `${n.toFixed(0)}%`;
export const fmtTemp = (n) => `${n.toFixed(1)}°C`;
