const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ad_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('الصور المدعومة: JPEG, PNG, GIF, WebP'));
  }
});

// Helpers
async function getSettings() {
  const result = await db.query('SELECT * FROM coupon_settings WHERE id = 1');
  if (result.rows.length === 0) {
    const newResult = await db.query('INSERT INTO coupon_settings (id) VALUES (1) RETURNING *');
    return newResult.rows[0];
  }
  return result.rows[0];
}

async function getActiveRound() {
  let result = await db.query('SELECT * FROM draw_rounds WHERE is_active = true ORDER BY created_at DESC LIMIT 1');
  if (result.rows.length === 0) {
    result = await db.query('INSERT INTO draw_rounds (is_active) VALUES (true) RETURNING *');
  }
  return result.rows[0];
}

function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WIN-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ──────────────────────────────────────────────
// Public API Routes
// ──────────────────────────────────────────────

router.get('/draw/status', async (req, res) => {
  try {
    const settings = await getSettings();
    if (!settings.coupon_system_enabled) {
      return res.json({ enabled: false, round: null });
    }

    const roundResult = await db.query('SELECT * FROM draw_rounds ORDER BY created_at DESC LIMIT 1');
    let round = roundResult.rows[0];

    if (!round) {
      const newRound = await db.query('INSERT INTO draw_rounds (is_active) VALUES (true) RETURNING *');
      round = newRound.rows[0];
      return res.json({ enabled: true, round: { id: round.id, isActive: true, entryCount: 0 } });
    }

    const countResult = await db.query('SELECT COUNT(*) FROM draw_entries WHERE round_id = $1', [round.id]);
    const entryCount = parseInt(countResult.rows[0].count, 10);

    res.json({
      enabled: true,
      round: {
        id: round.id,
        isActive: round.is_active,
        entryCount,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.post('/draw/enter', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await getSettings();
    if (!settings.coupon_system_enabled) {
      return res.status(400).json({ error: 'نظام الكوبونات معطل حالياً' });
    }

    const round = await getActiveRound();

    // Check if currently waiting
    const activeResult = await db.query("SELECT * FROM draw_entries WHERE user_id = $1 AND round_id = $2 AND status = 'WAITING'", [userId, round.id]);
    if (activeResult.rows.length > 0) {
       return res.status(400).json({ error: 'لديك سحب قيد الانتظار بالفعل' });
    }

    // Check daily limit
    const countResult = await db.query('SELECT COUNT(*) FROM draw_entries WHERE user_id = $1 AND round_id = $2', [userId, round.id]);
    const entriesCount = parseInt(countResult.rows[0].count, 10);
    if (entriesCount >= settings.daily_limit) {
       return res.status(400).json({ error: `لقد استنفدت الحد المسموح لك وهو ${settings.daily_limit} محاولات في هذه الجولة` });
    }

    // Create entry
    await db.query("INSERT INTO draw_entries (user_id, round_id, status) VALUES ($1, $2, 'WAITING')", [userId, round.id]);

    const totalCountRes = await db.query('SELECT COUNT(*) FROM draw_entries WHERE round_id = $1', [round.id]);
    const totalEntryCount = parseInt(totalCountRes.rows[0].count, 10);

    res.json({ 
      success: true, 
      timerDuration: settings.timer_duration || 60,
      entryCount: totalEntryCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.post('/draw/heartbeat', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const round = await getActiveRound();
    const result = await db.query("SELECT id FROM draw_entries WHERE user_id = $1 AND round_id = $2 AND status = 'WAITING'", [userId, round.id]);
    if (result.rows.length > 0) {
      await db.query('UPDATE draw_entries SET last_heartbeat = NOW() WHERE id = $1', [result.rows[0].id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ error: 'خطأ' });
  }
});

router.post('/draw/forfeit', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const round = await getActiveRound();
    const result = await db.query("SELECT id FROM draw_entries WHERE user_id = $1 AND round_id = $2 AND status = 'WAITING'", [userId, round.id]);
    if (result.rows.length > 0) {
      await db.query("UPDATE draw_entries SET status = 'FORFEITED' WHERE id = $1", [result.rows[0].id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ error: 'خطأ' });
  }
});

router.post('/draw/result', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const round = await getActiveRound();
    const settings = await getSettings();

    const entryRes = await db.query('SELECT * FROM draw_entries WHERE user_id = $1 AND round_id = $2 ORDER BY created_at DESC LIMIT 1', [userId, round.id]);
    const entry = entryRes.rows[0];

    if (!entry) return res.status(400).json({ error: 'غير مسجل' });

    if (entry.status === 'COMPLETED') {
      return res.json({ success: true, isWinner: entry.is_winner, couponValue: entry.coupon_value });
    }

    if (entry.status === 'FORFEITED') {
      return res.json({ success: true, isWinner: false, forfeited: true });
    }

    const now = new Date();
    const heartbeatDiff = now - new Date(entry.last_heartbeat);
    
    // Check if heartbeat is valid
    if (heartbeatDiff > 25000) {
      await db.query("UPDATE draw_entries SET status = 'FORFEITED' WHERE id = $1", [entry.id]);
      return res.json({ success: true, isWinner: false, forfeited: true });
    }

    // Determine if winner
    let isWinner = false;
    let couponValue = null;
    let drawnAt = null;

    const winnersRes = await db.query('SELECT COUNT(*) FROM draw_entries WHERE round_id = $1 AND is_winner = true', [round.id]);
    const currentWinnersCount = parseInt(winnersRes.rows[0].count, 10);

    if (currentWinnersCount < settings.winners_per_day) {
      isWinner = true;
      couponValue = settings.coupon_value;
      drawnAt = new Date();
      // Add balance to user
      await db.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [couponValue, userId]);
    }

    await db.query(
      "UPDATE draw_entries SET status = 'COMPLETED', is_winner = $1, coupon_value = $2, drawn_at = $3 WHERE id = $4",
      [isWinner, couponValue, drawnAt, entry.id]
    );

    res.json({ 
      success: true, 
      isWinner,
      couponValue,
      forfeited: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

router.get('/advertisement', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM advertisements WHERE is_active = true ORDER BY created_at ASC');
    const formattedAds = result.rows.map(a => ({
      id: a.id,
      imageUrl: a.image_url,
      caption: a.caption,
      isActive: a.is_active,
      createdAt: a.created_at
    }));
    res.json(formattedAds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.get('/dynamic-ads', async (req, res) => {
  try {
    const { placement } = req.query;
    
    // In PostgreSQL, NOW() gets the current time.
    const result = await db.query(`
      SELECT * FROM dynamic_ads 
      WHERE is_active = true 
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY created_at DESC
    `);
    
    const formattedAds = result.rows.map(a => ({
      id: a.id,
      title: a.title,
      htmlCode: a.html_code,
      targetLink: a.target_link,
      placement: a.placement,
      isActive: a.is_active,
      views: a.views,
      clicks: a.clicks,
      createdAt: a.created_at
    }));

    const filteredAds = placement 
      ? formattedAds.filter(ad => ad.placement === 'Both' || ad.placement === placement)
      : formattedAds;
      
    res.json(filteredAds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.post('/dynamic-ads/:id/view', async (req, res) => {
  try {
    await db.query('UPDATE dynamic_ads SET views = views + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

router.post('/dynamic-ads/:id/click', async (req, res) => {
  try {
    await db.query('UPDATE dynamic_ads SET clicks = clicks + 1 WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

// ──────────────────────────────────────────────
// Admin Routes (using existing requireAdmin)
// ──────────────────────────────────────────────

router.get('/admin/coupon-settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      id: settings.id,
      timerDuration: settings.timer_duration,
      maxCouponValue: settings.max_coupon_value,
      dailyLimit: settings.daily_limit,
      couponSystemEnabled: settings.coupon_system_enabled,
      winnersPerDay: settings.winners_per_day,
      couponValue: settings.coupon_value
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/admin/coupon-settings', requireAuth, requireAdmin, async (req, res) => {
  const { timerDuration, maxCouponValue, dailyLimit, couponSystemEnabled, winnersPerDay, couponValue } = req.body;
  try {
    const result = await db.query(`
      UPDATE coupon_settings 
      SET timer_duration = $1, max_coupon_value = $2, daily_limit = $3, coupon_system_enabled = $4, winners_per_day = $5, coupon_value = $6 
      WHERE id = 1 RETURNING *
    `, [timerDuration, maxCouponValue, dailyLimit, couponSystemEnabled, winnersPerDay, couponValue]);
    
    const settings = result.rows[0];
    res.json({
      id: settings.id,
      timerDuration: settings.timer_duration,
      maxCouponValue: settings.max_coupon_value,
      dailyLimit: settings.daily_limit,
      couponSystemEnabled: settings.coupon_system_enabled,
      winnersPerDay: settings.winners_per_day,
      couponValue: settings.coupon_value
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/draw', requireAuth, requireAdmin, async (req, res) => {
  try {
    const round = await getActiveRound();
    const entriesResult = await db.query('SELECT * FROM draw_entries WHERE round_id = $1 ORDER BY created_at ASC', [round.id]);
    const entries = entriesResult.rows.map(e => ({
      id: e.id, phone: e.phone, status: e.status, isWinner: e.is_winner, 
      couponCode: e.coupon_code, couponValue: e.coupon_value, createdAt: e.created_at
    }));
    const winners = entries.filter(e => e.isWinner);
    res.json({ round: { id: round.id, isActive: round.is_active, cycleStartDate: round.cycle_start_date }, entries, winners });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.get('/admin/history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const roundsResult = await db.query('SELECT * FROM draw_rounds WHERE is_active = false ORDER BY cycle_start_date DESC');
    const rounds = roundsResult.rows.map(r => ({
      id: r.id, isActive: r.is_active, cycleStartDate: r.cycle_start_date, cycleEndDate: r.cycle_end_date, entries: []
    }));
    
    const roundIds = rounds.map(r => r.id);
    if (roundIds.length > 0) {
      const entriesResult = await db.query('SELECT * FROM draw_entries WHERE round_id = ANY($1::int[])', [roundIds]);
      entriesResult.rows.forEach(e => {
        const round = rounds.find(r => r.id === e.round_id);
        if (round) round.entries.push({
           id: e.id, phone: e.phone, status: e.status, isWinner: e.is_winner, 
           couponCode: e.coupon_code, createdAt: e.created_at
        });
      });
    }
    
    res.json(rounds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.post('/admin/draw/end', requireAuth, requireAdmin, async (req, res) => {
  try {
    const round = await getActiveRound();
    if (round) {
      await db.query('UPDATE draw_rounds SET is_active = false, cycle_end_date = NOW() WHERE id = $1', [round.id]);
      await db.query('INSERT INTO draw_rounds (is_active) VALUES (true)');
      res.json({ success: true, message: 'تم إنهاء الجولة بنجاح وبدء جولة جديدة' });
    } else {
      res.status(400).json({ error: 'لا توجد جولة نشطة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء إنهاء الجولة' });
  }
});

router.post('/admin/system/reset', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE draw_entries CASCADE');
    await db.query('TRUNCATE TABLE draw_rounds CASCADE');
    await db.query('TRUNCATE TABLE dynamic_ads CASCADE');
    await db.query('TRUNCATE TABLE advertisements CASCADE');
    await db.query('UPDATE coupon_settings SET timer_duration=60, max_coupon_value=200, daily_limit=2, coupon_system_enabled=true, winners_per_day=5, coupon_value=50 WHERE id = 1');
    await db.query('INSERT INTO draw_rounds (is_active) VALUES (true)');
    res.json({ success: true, message: 'تم إعادة ضبط المصنع ومسح جميع بيانات الكوبونات بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء إعادة ضبط المصنع' });
  }
});

router.get('/admin/advertisement', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM advertisements WHERE is_active = true ORDER BY created_at ASC');
    res.json(result.rows.map(a => ({ id: a.id, imageUrl: a.image_url, caption: a.caption, isActive: a.is_active })));
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.post('/admin/advertisement', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { caption } = req.body;
    if (!req.file) return res.status(400).json({ error: 'الرجاء رفع صورة' });
    if (!caption || !caption.trim()) return res.status(400).json({ error: 'الرجاء إدخال وصف الإعلان' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const result = await db.query(
      'INSERT INTO advertisements (image_url, caption, is_active) VALUES ($1, $2, true) RETURNING *',
      [imageUrl, caption.trim()]
    );
    const ad = result.rows[0];

    res.json({ success: true, ad: { id: ad.id, imageUrl: ad.image_url, caption: ad.caption, isActive: ad.is_active } });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء رفع الإعلان' });
  }
});

router.delete('/admin/advertisement/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const adId = parseInt(req.params.id, 10);
    const result = await db.query('SELECT * FROM advertisements WHERE id = $1', [adId]);
    if (result.rows.length > 0) {
      const ad = result.rows[0];
      const filePath = path.join(uploadsDir, path.basename(ad.image_url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await db.query('DELETE FROM advertisements WHERE id = $1', [adId]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الإعلان' });
  }
});

router.get('/admin/dynamic-ads', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dynamic_ads ORDER BY created_at DESC');
    res.json(result.rows.map(a => ({
      id: a.id, title: a.title, htmlCode: a.html_code, targetLink: a.target_link,
      placement: a.placement, isActive: a.is_active, views: a.views, clicks: a.clicks,
      startDate: a.start_date, endDate: a.end_date
    })));
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

router.post('/admin/dynamic-ads', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, htmlCode, targetLink, placement, isActive, startDate, endDate } = req.body;
    const result = await db.query(`
      INSERT INTO dynamic_ads (title, html_code, target_link, placement, is_active, start_date, end_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [title, htmlCode, targetLink, placement || 'Both', isActive !== false, startDate || null, endDate || null]);
    
    const ad = result.rows[0];
    res.json({ success: true, ad: {
      id: ad.id, title: ad.title, htmlCode: ad.html_code, targetLink: ad.target_link,
      placement: ad.placement, isActive: ad.is_active, views: ad.views, clicks: ad.clicks,
      startDate: ad.start_date, endDate: ad.end_date
    }});
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الإعلان' });
  }
});

router.put('/admin/dynamic-ads/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const adId = parseInt(req.params.id, 10);
    const { title, htmlCode, targetLink, placement, isActive, startDate, endDate } = req.body;
    const result = await db.query(`
      UPDATE dynamic_ads SET title = $1, html_code = $2, target_link = $3, placement = $4, is_active = $5, start_date = $6, end_date = $7 
      WHERE id = $8 RETURNING *
    `, [title, htmlCode, targetLink, placement, isActive, startDate || null, endDate || null, adId]);
    
    const ad = result.rows[0];
    res.json({ success: true, ad: {
      id: ad.id, title: ad.title, htmlCode: ad.html_code, targetLink: ad.target_link,
      placement: ad.placement, isActive: ad.is_active, views: ad.views, clicks: ad.clicks,
      startDate: ad.start_date, endDate: ad.end_date
    }});
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الإعلان' });
  }
});

router.delete('/admin/dynamic-ads/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM dynamic_ads WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الإعلان' });
  }
});

module.exports = router;
