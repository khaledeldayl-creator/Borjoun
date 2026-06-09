const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── helpers ──────────────────────────────────────────────────────────────────
async function getWheelSettings() {
  const res = await db.query('SELECT * FROM wheel_settings WHERE id = 1');
  if (res.rows.length === 0) {
    await db.query('INSERT INTO wheel_settings (id) VALUES (1)');
    return getWheelSettings();
  }
  return res.rows[0];
}

// ── Public: get wheel config ──────────────────────────────────────────────────
router.get('/wheel/settings', async (req, res) => {
  try {
    const s = await getWheelSettings();
    res.json({
      isEnabled: s.is_enabled,
      dailyLimit: s.daily_limit,
      segments: s.segments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Auth: how many spins left today ──────────────────────────────────────────
router.get('/wheel/spins-today', requireAuth, async (req, res) => {
  try {
    const s = await getWheelSettings();
    const countRes = await db.query(
      `SELECT COUNT(*) FROM wheel_spins
       WHERE user_id = $1 AND created_at::date = CURRENT_DATE`,
      [req.user.id]
    );
    const used = parseInt(countRes.rows[0].count, 10);
    res.json({ spinsUsed: used, dailyLimit: s.daily_limit, spinsLeft: Math.max(0, s.daily_limit - used) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Auth: spin the wheel ──────────────────────────────────────────────────────
router.post('/wheel/spin', requireAuth, async (req, res) => {
  try {
    const s = await getWheelSettings();

    if (!s.is_enabled) {
      return res.status(400).json({ error: 'Wheel is currently disabled' });
    }

    // Check daily limit
    const countRes = await db.query(
      `SELECT COUNT(*) FROM wheel_spins
       WHERE user_id = $1 AND created_at::date = CURRENT_DATE`,
      [req.user.id]
    );
    const used = parseInt(countRes.rows[0].count, 10);
    if (used >= s.daily_limit) {
      return res.status(400).json({ error: 'Daily spin limit reached', spinsLeft: 0 });
    }

    // Pick random segment
    const segments = s.segments;
    const segmentIndex = Math.floor(Math.random() * segments.length);
    const segment = segments[segmentIndex];
    const reward = segment.value;

    // Credit user
    await db.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1 WHERE id = $2',
      [reward, req.user.id]
    );

    // Log spin
    await db.query(
      'INSERT INTO wheel_spins (user_id, result, segment_label) VALUES ($1, $2, $3)',
      [req.user.id, reward, segment.label]
    );

    const spinsLeft = Math.max(0, s.daily_limit - used - 1);

    res.json({
      success: true,
      segmentIndex,
      reward,
      label: segment.label,
      spinsLeft,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: get wheel settings ─────────────────────────────────────────────────
router.get('/admin/wheel', requireAuth, requireAdmin, async (req, res) => {
  try {
    const s = await getWheelSettings();
    res.json({
      isEnabled: s.is_enabled,
      dailyLimit: s.daily_limit,
      segments: s.segments,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: update wheel settings ─────────────────────────────────────────────
router.post('/admin/wheel', requireAuth, requireAdmin, async (req, res) => {
  const { isEnabled, dailyLimit, segments } = req.body;
  try {
    if (!Array.isArray(segments) || segments.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 segments' });
    }
    await db.query(
      `UPDATE wheel_settings SET is_enabled = $1, daily_limit = $2, segments = $3 WHERE id = 1`,
      [isEnabled, dailyLimit, JSON.stringify(segments)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: spin history ────────────────────────────────────────────────────────
router.get('/admin/wheel/history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ws.*, u.username FROM wheel_spins ws
      JOIN users u ON ws.user_id = u.id
      ORDER BY ws.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
