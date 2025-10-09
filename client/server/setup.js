// server/setup.js  (ESM)
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import multer from 'multer';

const app = express();

// config
const PORT = process.env.PORT || 3000;
// default AP IP; override with ESP_BASE env
const ESP_BASE = process.env.ESP_BASE || 'http://192.168.4.1';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ax = axios.create({ baseURL: ESP_BASE, timeout: 8000 });

// Health
app.get('/health', (req, res) => res.json({ ok: true, esp: ESP_BASE }));

// ----- Wi-Fi proxy endpoints -----
app.get('/api/wifi/scan', async (req, res) => {
  try { const r = await ax.get('/api/wifi/scan'); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/wifi/connect', async (req, res) => {
  try { const r = await ax.post('/api/wifi/connect', req.body); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/wifi/status', async (req, res) => {
  try { const r = await ax.get('/api/wifi/status'); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/wifi/saved', async (req, res) => {
  try { const r = await ax.get('/api/wifi/saved'); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/wifi/forget', async (req, res) => {
  try { const r = await ax.post('/api/wifi/forget', req.body || {}); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

// ----- AP + device mgmt -----
app.get('/api/ap/info', async (req, res) => {
  try { const r = await ax.get('/api/ap/info'); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/ap/update', async (req, res) => {
  try { const r = await ax.post('/api/ap/update', req.body); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/device/info', async (req, res) => {
  try { const r = await ax.get('/api/device/info'); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/device/reboot', async (_req, res) => {
  try { const r = await ax.post('/api/device/reboot', {}); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/device/factory_reset', async (_req, res) => {
  try { const r = await ax.post('/api/device/factory_reset', {}); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

// ----- Captive + net check -----
app.get('/api/captive/status', async (_req, res) => {
  try { const r = await ax.get('/api/captive/status'); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/captive/set', async (req, res) => {
  try { const r = await ax.post('/api/captive/set', req.body || {}); res.json(r.data); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/net/check', async (_req, res) => {
  try { const r = await ax.get('/api/net/check'); res.json(r.data); }
  catch (e) { res.status(502).json({ ok:false, error: e.message }); }
});

// ----- OTA upload (multipart) -----
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/ota/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  // forward file to ESP as multipart/form-data
  const form = new FormData();
  form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);

  try {
    // Node 22 has fetch; use it to stream the multipart form
    const r = await fetch(`${ESP_BASE}/api/ota/upload`, {
      method: 'POST',
      body: form,
      // fetch sets headers for FormData automatically
      duplex: 'half', // quiets Node 18+/22 streaming warning
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json().catch(() => ({}));
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Minimal index (plain HTML)
app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>SmartPlant Config</title></head>
<body>
  <h1>SmartPlant Config Server</h1>
  <p>Proxying to ESP32: <code>${ESP_BASE}</code></p>
  <pre>Use /api/wifi/scan, /api/wifi/connect, /api/wifi/status, ...</pre>
</body></html>`);
});

app.listen(PORT, () => {
  console.log(`SmartPlant Config Server running at http://localhost:${PORT} -> ESP ${ESP_BASE}`);
});

export default app;
