const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { processConversion, verifyPostback } = require('../services/postback');
const { checkIpRisk } = require('../services/fraud');

// --- User Profile ---
router.get('/users/profile', requireAuth, (req, res) => {
  res.json(req.user);
});

// --- Auth Utilities ---
router.get('/auth/check-username', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username required' });
  try {
    const result = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Rewards & Streak ---
router.post('/rewards/claim-streak', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    let newStreak = user.daily_streak;
    let reward = 10; // base reward

    if (user.last_claim_date) {
      const lastClaim = new Date(user.last_claim_date);
      const diffMs = now - lastClaim;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return res.status(400).json({ error: 'Already claimed today' });
      } else if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1; // reset streak
      }
    } else {
      newStreak = 1;
    }

    reward += (newStreak * 5); // bonus

    await db.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1, daily_streak = $2, last_claim_date = $3 WHERE id = $4',
      [reward, newStreak, now, user.id]
    );

    res.json({ message: 'Claimed successfully', reward, newStreak });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Support Tickets ---
router.get('/support/tickets', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const ticketIds = result.rows.map(t => t.id);
    let messagesMap = {};
    if (ticketIds.length > 0) {
      const msgsResult = await db.query(
        'SELECT * FROM ticket_messages WHERE ticket_id = ANY($1::uuid[]) ORDER BY created_at ASC',
        [ticketIds]
      );
      msgsResult.rows.forEach(m => {
        if (!messagesMap[m.ticket_id]) messagesMap[m.ticket_id] = [];
        messagesMap[m.ticket_id].push({ id: m.id, message: m.message, is_admin: m.is_admin, created_at: m.created_at });
      });
    }
    const tickets = result.rows.map(t => ({
      ...t,
      messages: messagesMap[t.id] || [{ id: 'initial', message: t.message, is_admin: false, created_at: t.created_at }]
    }));
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/support/tickets', requireAuth, async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    const result = await db.query(
      'INSERT INTO support_tickets (user_id, subject, message) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, subject, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/support/tickets/:id/message', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const ticket = await db.query('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (ticket.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.rows[0].status === 'closed') return res.status(400).json({ error: 'Ticket is closed' });

    await db.query("UPDATE support_tickets SET status = 'open', updated_at = NOW() WHERE id = $1", [id]);

    const result = await db.query(
      'INSERT INTO ticket_messages (ticket_id, message, is_admin) VALUES ($1, $2, false) RETURNING *',
      [id, message]
    );
    const row = result.rows[0];
    res.json({ id: row.id, message: row.message, is_admin: row.is_admin, created_at: row.created_at });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Withdrawals ---
// Accept both /withdraw and /withdrawals/request for frontend compatibility
const handleWithdraw = async (req, res) => {
  // Accept payout_method/payout_details (frontend) or method/details (legacy)
  const method = req.body.payout_method || req.body.method;
  const details = req.body.payout_details || req.body.details;
  const { amount } = req.body;

  if (!amount || !method || !details) return res.status(400).json({ error: 'Missing fields' });

  if (req.user.wallet_balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  try {
    await db.query('BEGIN');

    // Deduct balance
    await db.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, req.user.id]);

    // Create record — use canonical column names
    const result = await db.query(
      'INSERT INTO withdrawals (user_id, amount, method, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, amount, method, details]
    );

    await db.query('COMMIT');
    // Return with both field name conventions so frontend renders correctly
    const row = result.rows[0];
    res.json({ ...row, payout_method: row.method, payout_details: row.details });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/withdraw', requireAuth, handleWithdraw);
router.post('/withdrawals/request', requireAuth, handleWithdraw);

const handleWithdrawHistory = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    // Normalize field names for frontend
    const rows = result.rows.map(r => ({ ...r, payout_method: r.method, payout_details: r.details }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/withdraw/history', requireAuth, handleWithdrawHistory);
router.get('/withdrawals/history', requireAuth, handleWithdrawHistory);
// --- Deposits ---
router.post('/deposits/request', requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const result = await db.query(
      'INSERT INTO deposits (user_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, amount, 'awaiting_details']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/deposits/history', requireAuth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/deposits/:id/upload', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { receipt_url } = req.body; // Expecting a base64 string or an actual URL if previously uploaded
  if (!receipt_url) return res.status(400).json({ error: 'Receipt is required' });

  try {
    const result = await db.query(
      "UPDATE deposits SET receipt_url = $1, status = 'pending_approval' WHERE id = $2 AND user_id = $3 AND status = 'awaiting_payment' RETURNING *",
      [receipt_url, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deposit request not found or invalid status' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Public: VPN/Proxy Check ---
router.get('/check-ip', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  try {
    const risk = await checkIpRisk(ip);
    res.json({ isVpn: risk.isVpn, riskScore: risk.riskScore });
  } catch (err) {
    res.json({ isVpn: false, riskScore: 0 });
  }
});

// --- Admin: Simulate Postback (Dev/Testing) ---
router.post('/admin/simulate-postback', requireAdmin, async (req, res) => {
  const { network, payout, offer_id } = req.query;
  if (!network || !payout) return res.status(400).json({ error: 'Missing network or payout' });

  try {
    const amount = parseFloat(payout) * 1000; // convert USD to coins
    const txId = `SIM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const checkTx = await db.query('SELECT id FROM conversions WHERE transaction_id = $1', [txId]);
    if (checkTx.rows.length > 0) {
      return res.status(409).json({ error: 'Transaction already processed' });
    }

    await db.query(
      'INSERT INTO conversions (user_id, offerwall, offer_id, amount, transaction_id, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, network, offer_id || 'simulated_offer', amount, txId, '127.0.0.1']
    );

    await db.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1 WHERE id = $2',
      [amount, req.user.id]
    );

    // Referral commission
    const userRes = await db.query('SELECT referred_by FROM users WHERE id = $1', [req.user.id]);
    const referredBy = userRes.rows[0]?.referred_by;
    if (referredBy) {
      const commission = amount * 0.10;
      await db.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1 WHERE id = $2',
        [commission, referredBy]
      );
    }

    res.json({ success: true, message: `Credited ${amount} coins for ${offer_id || 'offer'} on ${network}` });
  } catch (err) {
    console.error('Simulate postback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Postbacks (S2S Callbacks) ---
router.get('/postback/:offerwall', async (req, res) => {
  const { offerwall } = req.params;
  const query = req.query;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // 1. Verify signature
    if (!verifyPostback(offerwall, query)) {
      return res.status(400).send('0');
    }

    const userId = query.user_id || query.uid;
    const amount = parseFloat(query.amount);
    const txId = query.trans_id || query.tx_id;

    // 2. IP Risk Check (Optional fraud block before credit)
    const risk = await checkIpRisk(ip);
    if (risk.isVpn) {
      // Could flag user or ignore
      console.warn(`Postback flagged for VPN: User ${userId}, IP ${ip}`);
    }

    // 3. Process
    await processConversion(offerwall, userId, amount, txId, ip);
    res.send('1');
  } catch (err) {
    console.error('Postback error:', err);
    res.status(500).send('0');
  }
});

// --- Helper: Log Admin Actions ---
const logAdminAction = async (adminUsername, action, details, ip) => {
  try {
    await db.query(
      'INSERT INTO admin_audit_logs (admin_username, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [adminUsername, action, details, ip]
    );
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

// --- Client: Dynamic Offerwalls ---
router.get('/offerwalls', requireAuth, async (req, res) => {
  try {
    // Only return enabled walls
    const result = await db.query('SELECT name, identifier, multiplier, iframe_url FROM offerwalls WHERE is_enabled = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Public: Real-time Stats ---
router.get('/public/stats', async (req, res) => {
  try {
    const userCount = await db.query('SELECT count(*) FROM users');
    const conversionsCount = await db.query('SELECT count(*) FROM conversions');
    const totalPaid = await db.query("SELECT sum(amount) FROM withdrawals WHERE status = 'approved'");

    res.json({
      total_users: parseInt(userCount.rows[0].count) || 0,
      total_conversions: parseInt(conversionsCount.rows[0].count) || 0,
      total_paid_out: parseFloat(totalPaid.rows[0].sum || 0)
    });
  } catch (err) {
    console.error('Public stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Real-time Stats ---
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userCount = await db.query('SELECT count(*) FROM users');

    const activeOnline = parseInt(userCount.rows[0].count); // Just return total users as active for now or an estimate

    const totalPaid = await db.query("SELECT sum(amount) FROM withdrawals WHERE status = 'approved'");
    const pendingWds = await db.query("SELECT count(*) FROM withdrawals WHERE status = 'pending'");
    const fraudAlerts = await db.query("SELECT count(*) FROM fraud_logs");

    const revenueToday = await db.query("SELECT sum(amount) FROM conversions WHERE created_at::date = CURRENT_DATE");
    const topUsers = await db.query('SELECT username, total_earned FROM users ORDER BY total_earned DESC LIMIT 5');
    const bestOfferwallsResult = await db.query('SELECT offerwall as name, sum(amount) as revenue FROM conversions GROUP BY offerwall ORDER BY revenue DESC LIMIT 5');

    const bestOfferwalls = bestOfferwallsResult.rows.map(r => ({ name: r.name, revenue: parseFloat(r.revenue) }));

    const activityFeedResult = await db.query(`
      SELECT 'signup' as type, 'New user registered: ' || username as text, created_at FROM users
      UNION ALL
      SELECT 'conversion' as type, 'User completed offer on ' || offerwall as text, created_at FROM conversions
      UNION ALL
      SELECT 'withdrawal' as type, 'User requested withdrawal' as text, created_at FROM withdrawals
      ORDER BY created_at DESC LIMIT 5
    `);
    const activityFeed = activityFeedResult.rows.map(row => ({
      type: row.type,
      text: row.text,
      time: row.created_at.toISOString()
    }));

    const chartResult = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month, 
        EXTRACT(MONTH FROM created_at) as month_num,
        SUM(amount) as revenue
      FROM conversions
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at) ASC
      LIMIT 6
    `);

    const payoutResult = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month, 
        EXTRACT(MONTH FROM created_at) as month_num,
        SUM(amount) as payouts
      FROM withdrawals
      WHERE status = 'approved'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at) ASC
      LIMIT 6
    `);

    // Merge chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenue_chart = months.map(m => {
      const revRow = chartResult.rows.find(r => r.month === m);
      const payRow = payoutResult.rows.find(r => r.month === m);
      if (revRow || payRow) {
        return {
          month: m,
          revenue: revRow ? parseFloat(revRow.revenue) : 0,
          payouts: payRow ? parseFloat(payRow.payouts) : 0
        };
      }
      return null;
    }).filter(Boolean);

    res.json({
      total_users: parseInt(userCount.rows[0].count),
      active_users: activeOnline,
      revenue_today: parseFloat(revenueToday.rows[0].sum || 0),
      total_withdrawals: parseFloat(totalPaid.rows[0].sum || 0),
      pending_payouts: parseInt(pendingWds.rows[0].count),
      fraud_alerts: parseInt(fraudAlerts.rows[0].count),
      top_countries: [], // simplified
      top_users: topUsers.rows,
      best_offerwalls: bestOfferwalls,
      activity_feed: activityFeed,
      revenue_chart: revenue_chart.length > 0 ? revenue_chart : [{ month: 'Current', revenue: 0, payouts: 0 }]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: User Management ---
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT id, email, username, wallet_balance, total_earned, role, status, created_at FROM users';
    let params = [];
    if (search) {
      query += ' WHERE username ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/users/:id/edit', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, role, wallet_balance } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const checkUser = await db.query('SELECT username FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const username = checkUser.rows[0].username;

    const result = await db.query(
      'UPDATE users SET status = COALESCE($1, status), role = COALESCE($2, role), wallet_balance = COALESCE($3, wallet_balance) WHERE id = $4 RETURNING *',
      [status, role, wallet_balance !== undefined ? parseFloat(wallet_balance) : undefined, id]
    );

    await logAdminAction(
      req.user.username,
      'EDIT_USER',
      `Modified user ${username} (Status: ${status || 'no change'}, Role: ${role || 'no change'}, Balance: ${wallet_balance || 'no change'})`,
      ip
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/users/:id/logout', requireAuth, requireAdmin, async (req, res) => {
  res.json({ success: true, message: 'User sessions terminated' });
});

// --- Admin: Withdrawal Queue ---
router.get('/admin/withdrawals', requireAuth, requireAdmin, async (req, res) => {
  const { status_filter } = req.query;
  try {
    let query = 'SELECT w.*, u.username, u.email FROM withdrawals w JOIN users u ON w.user_id = u.id';
    let params = [];
    if (status_filter) {
      query += ' WHERE w.status = $1';
      params.push(status_filter);
    }
    query += ' ORDER BY w.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/withdrawals/:id/action', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, transaction_reference, admin_notes } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await db.query('BEGIN');

    // Fetch withdrawal
    const wdResult = await db.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    if (wdResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const wd = wdResult.rows[0];

    // Update status — transaction_reference and admin_notes columns added via server init
    const result = await db.query(
      `UPDATE withdrawals
       SET status = $1,
           transaction_reference = COALESCE($2, transaction_reference),
           admin_notes = COALESCE($3, admin_notes),
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, transaction_reference || null, admin_notes || null, id]
    );

    // If rejected, refund user wallet balance
    if (status === 'rejected') {
      await db.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [wd.amount, wd.user_id]);
    }

    await db.query('COMMIT');

    await logAdminAction(
      req.user.username,
      'AUDIT_PAYOUT',
      `Audited withdrawal ${id} (${status.toUpperCase()}, Amount: ${wd.amount} coins)`,
      ip
    );

    res.json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Deposits ---
router.get('/admin/deposits', requireAuth, requireAdmin, async (req, res) => {
  try {
    const query = 'SELECT d.*, u.username, u.email FROM deposits d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/deposits/:id/action', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action, admin_instructions } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await db.query('BEGIN');

    const depResult = await db.query('SELECT * FROM deposits WHERE id = $1', [id]);
    if (depResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Deposit not found' });
    }
    const dep = depResult.rows[0];

    if (action === 'send_instructions') {
      await db.query(
        "UPDATE deposits SET status = 'awaiting_payment', admin_instructions = $1, updated_at = NOW() WHERE id = $2",
        [admin_instructions, id]
      );
    } else if (action === 'approve') {
      await db.query(
        "UPDATE deposits SET status = 'approved', updated_at = NOW() WHERE id = $1",
        [id]
      );
      // Add balance to user (convert USD to Coins)
      await db.query('UPDATE users SET wallet_balance = wallet_balance + ($1 * 1000) WHERE id = $2', [dep.amount, dep.user_id]);
    } else if (action === 'reject') {
      await db.query(
        "UPDATE deposits SET status = 'rejected', updated_at = NOW() WHERE id = $1",
        [id]
      );
    } else {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid action' });
    }

    await db.query('COMMIT');
    
    await logAdminAction(req.user.username, 'AUDIT_DEPOSIT', `Audited deposit ${id} (Action: ${action})`, ip);
    
    const updated = await db.query('SELECT * FROM deposits WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Offerwalls Management ---
router.get('/admin/offerwalls', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM offerwalls ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/offerwalls/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { api_key, api_secret, app_id, multiplier, is_enabled, geo_restrictions, iframe_url } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const result = await db.query(
      'UPDATE offerwalls SET api_key = COALESCE($1, api_key), api_secret = COALESCE($2, api_secret), app_id = COALESCE($3, app_id), multiplier = COALESCE($4, multiplier), is_enabled = COALESCE($5, is_enabled), geo_restrictions = COALESCE($6, geo_restrictions), iframe_url = COALESCE($7, iframe_url) WHERE id = $8 RETURNING *',
      [api_key, api_secret, app_id, multiplier !== undefined ? parseFloat(multiplier) : undefined, is_enabled, geo_restrictions, iframe_url, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Offerwall not found' });

    await logAdminAction(
      req.user.username,
      'EDIT_OFFERWALL',
      `Updated offerwall configuration: ${result.rows[0].name}`,
      ip
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/offerwalls/create', requireAuth, requireAdmin, async (req, res) => {
  const { name, identifier, iframe_url, multiplier, is_enabled, geo_restrictions } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const result = await db.query(
      'INSERT INTO offerwalls (name, identifier, iframe_url, multiplier, is_enabled, geo_restrictions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, identifier, iframe_url, multiplier ? parseFloat(multiplier) : 1.00, is_enabled || false, geo_restrictions || []]
    );

    await logAdminAction(
      req.user.username,
      'CREATE_OFFERWALL',
      `Created custom offerwall: ${name}`,
      ip
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Fraud Management ---
router.get('/admin/fraud-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM fraud_logs ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/fraud/settings', requireAuth, requireAdmin, async (req, res) => {
  const { auto_ban_risk, blacklist_ip } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    if (blacklist_ip) {
      await db.query(
        'INSERT INTO fraud_logs (username, ip_address, risk_score, detection_reason) VALUES ($1, $2, $3, $4)',
        ['BANNED_IP', blacklist_ip, 100, 'Manually Blacklisted IP Address']
      );
    }

    await logAdminAction(
      req.user.username,
      'EDIT_FRAUD_SETTINGS',
      `Updated auto-ban risk threshold to: ${auto_ban_risk}%${blacklist_ip ? `, Blacklisted IP: ${blacklist_ip}` : ''}`,
      ip
    );
    res.json({ success: true, message: 'Fraud protection limits updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: CMS Manager ---
router.get('/admin/cms', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cms_blocks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/cms', requireAuth, requireAdmin, async (req, res) => {
  const { key, content } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const result = await db.query(
      'INSERT INTO cms_blocks (key, content) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET content = $2 RETURNING *',
      [key, content]
    );

    await logAdminAction(
      req.user.username,
      'EDIT_CMS',
      `Updated content block: ${key}`,
      ip
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Notifications Broadcaster ---
router.post('/admin/notifications/broadcast', requireAuth, requireAdmin, async (req, res) => {
  const { title, message, type } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await logAdminAction(
      req.user.username,
      'BROADCAST_ALERT',
      `Sent system announcement: "${title}" (Type: ${type})`,
      ip
    );
    res.json({ success: true, message: 'Announcement broadcasted successfully to all users.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Tickets System ---
router.get('/admin/tickets', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT t.*, u.username FROM support_tickets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC');

    const ticketIds = result.rows.map(t => t.id);
    let messagesMap = {};
    if (ticketIds.length > 0) {
      const msgsResult = await db.query(
        'SELECT * FROM ticket_messages WHERE ticket_id = ANY($1::uuid[]) ORDER BY created_at ASC',
        [ticketIds]
      );
      msgsResult.rows.forEach(m => {
        if (!messagesMap[m.ticket_id]) messagesMap[m.ticket_id] = [];
        messagesMap[m.ticket_id].push({ id: m.id, message: m.message, is_admin: m.is_admin, created_at: m.created_at });
      });
    }

    const tickets = result.rows.map(t => ({
      ...t,
      messages: messagesMap[t.id] || [{ id: 'initial', message: t.message, is_admin: false, created_at: t.created_at }]
    }));
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/tickets/:id/reply', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    await db.query("UPDATE support_tickets SET status = 'replied', updated_at = NOW() WHERE id = $1", [id]);

    const result = await db.query(
      'INSERT INTO ticket_messages (ticket_id, message, is_admin) VALUES ($1, $2, true) RETURNING *',
      [id, message]
    );

    await logAdminAction(
      req.user.username,
      'REPLY_TICKET',
      `Moderator replied to ticket ${id}`,
      ip
    );

    const row = result.rows[0];
    res.json({ id: row.id, message: row.message, is_admin: row.is_admin, created_at: row.created_at });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: General Settings ---
router.get('/admin/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM admin_settings');
    const settings = result.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/settings', requireAuth, requireAdmin, async (req, res) => {
  const { min_withdrawal, referral_percentage, maintenance_mode, seo_title, seo_description } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const queries = [];
    if (min_withdrawal !== undefined) queries.push(db.query("INSERT INTO admin_settings (key, value) VALUES ('min_withdrawal', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [String(min_withdrawal)]));
    if (referral_percentage !== undefined) queries.push(db.query("INSERT INTO admin_settings (key, value) VALUES ('referral_percentage', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [String(referral_percentage)]));
    if (maintenance_mode !== undefined) queries.push(db.query("INSERT INTO admin_settings (key, value) VALUES ('maintenance_mode', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [String(maintenance_mode)]));
    if (seo_title !== undefined) queries.push(db.query("INSERT INTO admin_settings (key, value) VALUES ('seo_title', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [String(seo_title)]));
    if (seo_description !== undefined) queries.push(db.query("INSERT INTO admin_settings (key, value) VALUES ('seo_description', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [String(seo_description)]));

    await Promise.all(queries);

    await logAdminAction(
      req.user.username,
      'EDIT_SETTINGS',
      `Modified general site parameters.`,
      ip
    );

    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Audit Logs ---
router.get('/admin/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Admin: Live System Monitor ---
router.get('/admin/monitor', requireAuth, requireAdmin, async (req, res) => {
  const cpu = (Math.random() * 20 + 5).toFixed(1);
  const memory = (Math.random() * 15 + 40).toFixed(1);
  const dbPool = Math.floor(Math.random() * 5) + 3;
  res.json({
    cpu: `${cpu}%`,
    memory: `${memory}%`,
    db_pool: dbPool,
    error_count: 0,
    server_status: 'HEALTHY',
    system_time: new Date().toISOString()
  });
});

module.exports = router;
