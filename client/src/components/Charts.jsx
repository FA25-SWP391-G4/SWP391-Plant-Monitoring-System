import React, { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const palette = (dark) => ({
  grid: getComputedStyle(document.documentElement).getPropertyValue('--sg-grid') || (dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'),
  tick: getComputedStyle(document.documentElement).getPropertyValue('--sg-tick') || (dark ? '#e7e7e7' : '#334155'),
  legend: (dark ? '#f1f1f1' : '#0f172a'),
  soil: '#22c55e',
  light: '#f59e0b',
  humid: '#60a5fa',
  temp: '#a78bfa'
});

export function HistoryLine({ labels, series, dark=false }) {
  const c = palette(dark);
  const data = useMemo(()=>({
    labels,
    datasets: [
      { label: 'Soil Moisture (%)', data: series.soil, borderColor: c.soil, backgroundColor: c.soil, fill:false, tension:.35, pointRadius:0 },
      { label: 'Light (%)', data: series.light, borderColor: c.light, backgroundColor: c.light, fill:false, tension:.35, pointRadius:0 },
      { label: 'Humidity (%)', data: series.humidity, borderColor: c.humid, backgroundColor: c.humid, fill:false, tension:.35, pointRadius:0 },
      { label: 'Temperature (°C)', data: series.temp, borderColor: c.temp, backgroundColor: c.temp, fill:false, tension:.35, pointRadius:0 }
    ]
  }), [labels, series, dark]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: c.legend } }, tooltip: { mode: 'index', intersect: false } },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { color: c.grid }, ticks: { color: c.tick } },
      y: { grid: { color: c.grid }, ticks: { color: c.tick } }
    }
  };

  return (
    <div className="chart-wrap sg-animate" style={{height: 340}}>
      <Line data={data} options={options} />
    </div>
  );
}

export function WaterBar({ labels, values, dark=false }) {
  const c = palette(dark);
  const data = {
    labels,
    datasets: [{ label: 'Water level (%)', data: values, backgroundColor: c.humid, borderRadius: 6, barThickness: 14 }]
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: c.legend } } },
    scales: { x: { grid: { color: c.grid }, ticks: { color: c.tick } }, y: { grid: { color: c.grid }, ticks: { color: c.tick } } }
  };
  return (
    <div className="chart-wrap sg-animate" style={{height: 260}}>
      <Bar data={data} options={options} />
    </div>
  );
}
