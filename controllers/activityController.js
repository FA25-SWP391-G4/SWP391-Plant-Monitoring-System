const { pool } = require('../config/db');

// GET /api/activity/recent
// This endpoint reads recent events from existing tables (watering_history, sensors_data, alerts)
// and returns a unified activity list. It avoids creating any new tables so it works with
// your immutable schema.
async function getRecentActivity(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;

    // Build three subqueries and UNION them: waterings, sensor readings, alerts
    const wateringQ = `
      SELECT
        history_id::text AS id,
        'watering' AS type,
        (SELECT custom_name FROM plants p WHERE p.plant_id = w.plant_id) AS plant_name,
        to_jsonb(w.*) - 'history_id' - 'plant_id' AS payload,
        w.timestamp AS created_at
      FROM watering_history w
    `;

    const sensorsQ = `
      SELECT
        data_id::text AS id,
        'sensor' AS type,
        (SELECT custom_name FROM plants p WHERE p.device_key = s.device_key LIMIT 1) AS plant_name,
        to_jsonb(s.*) - 'data_id' - 'device_key' AS payload,
        s.timestamp AS created_at
      FROM sensors_data s
    `;

    const alertsQ = `
      SELECT
        alert_id::text AS id,
        'alert' AS type,
        NULL::text AS plant_name,
        jsonb_build_object('message', a.message) AS payload,
        a.created_at AS created_at
      FROM alerts a
    `;

    const unionQ = `SELECT * FROM ( ${wateringQ} UNION ALL ${sensorsQ} UNION ALL ${alertsQ} ) t ORDER BY created_at DESC LIMIT $1`;
    const { rows } = await pool.query(unionQ, [limit]);

    const activities = rows.map(r => ({
      id: r.id,
      type: r.type,
      plantName: r.plant_name || 'Unknown',
      timestamp: r.created_at,
      details: r.payload || {}
    }));

    res.json({ success: true, data: activities });
  } catch (err) {
    console.error('getRecentActivity error', err);
    res.status(500).json({ success: false, message: 'Failed to load recent activity' });
  }
}

module.exports = { getRecentActivity };
