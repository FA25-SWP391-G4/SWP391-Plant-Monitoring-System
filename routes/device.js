const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // assuming pg Pool is exported from db.js

// GET /api/devices?userId=4
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const result = await pool.query(
      `SELECT device_id, device_key, device_name, status, last_seen 
       FROM devices 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({ ok: true, devices: result.rows });
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
