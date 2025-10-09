import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export function ParamRadar({ plant, dark=false }) {
  const labels = ['Moisture', 'Light', 'Humidity', 'Temp (scaled)'];
  const tempScaled = Math.min(100, Math.max(0, (plant.temp - 10) * 5)); // 10–30°C → 0–100

  const data = {
    labels,
    datasets: [{
      label: plant.title,
      data: [plant.moisture, plant.light, plant.humidity, tempScaled],
      borderWidth: 2,
      fill: true
    }]
  };
  const grid = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const tick = dark ? '#eaeaea' : '#333';
  const options = {
    plugins: { legend: { position: 'bottom', labels:{ color: tick } } },
    scales: { r: { grid: { color: grid }, pointLabels:{ color: tick }, ticks:{ color: tick, backdropColor: 'transparent' } } }
  };
  return <Radar data={data} options={options} />;
}

export function exportCsv(rows, filename='sensors.csv') {
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
