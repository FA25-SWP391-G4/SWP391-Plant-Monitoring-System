const express = require('express');
const axios = require('axios');
const qs = require('qs');
const pool = require('../config/db')
const router = express.Router();

// POST /api/device-proxy/config
// Body: { deviceIp, ssid, password, deviceId?, plantId? }
router.post('/config', async (req, res) => {
  const { deviceIp, ssid, password, deviceId, plantId } = req.body;
  if (!deviceIp || !ssid) return res.status(400).json({ error: 'deviceIp and ssid required' });

    // 🧠 Detect if we're connected to SmartPlant_AP (no internet)
  if (deviceIp.startsWith("192.168.4.")) {
    console.log("📶 Detected SmartPlant AP mode — backend cannot reach device directly");
    return res.status(200).json({
      ok: false,
      message: "You are connected to the device AP. Please let the frontend send config directly to 192.168.4.1.",
    });
  }


  try {
    const payload = qs.stringify({ ssid, password, deviceId, plantId });
    const url = `http://${deviceIp}/config`;
    // increase timeout for flaky local device connections
    const resp = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    const deviceName = resp.data.deviceName || `ESP32_${Date.now()}`;
    const deviceKey = resp.data.deviceKey || `esp32-${Math.random().toString(36).slice(2, 10)}`;

    const insertResult = await pool.query(
       `INSERT INTO devices (user_id, device_key, device_name, status)
       VALUES ($1, $2, $3, 'online')
       ON CONFLICT (device_key) DO UPDATE SET status = 'online', last_seen = NOW()
       RETURNING device_id;`,
      [userId, deviceKey, deviceName]
    );

    return res.status(200).json({
      ok: true,
      data: {
        device_id: insertResult.rows[0].device_id,
        device_name: deviceName,
        device_key: deviceKey,
      },
      message: 'Device configured successfully',
    });
  } catch (err) {
    console.error('Device proxy error:', err.message || err, { deviceIp });
    // map common connection errors to user-friendly messages
    let details = err.message || String(err);
    if (err.code === 'ECONNREFUSED') details = 'Connection refused by device';
    if (err.code === 'ETIMEDOUT') details = 'Connection timed out';
    return res.status(502).json({ error: 'Failed to reach device', details });
  }
});

// GET /api/device-proxy/diagnose?deviceIp=192.168.4.1
router.get('/diagnose', async (req, res) => {
  const { deviceIp } = req.query;
  if (!deviceIp) return res.status(400).json({ error: 'deviceIp required' });

  try {
    const url = `http://${deviceIp}/status`;
    const resp = await axios.get(url, { timeout: 5000 });
    return res.json({ ok: true, status: resp.data || 'ok' });
  } catch (err) {
    console.error('Device diagnose error:', err.message || err, { deviceIp });
    let details = err.message || String(err);
    if (err.code === 'ECONNREFUSED') details = 'Connection refused by device';
    if (err.code === 'ETIMEDOUT') details = 'Connection timed out';
    return res.status(502).json({ ok: false, error: 'Device unreachable from server', details });
  }
});

module.exports = router;
