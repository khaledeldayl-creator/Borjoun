const crypto = require('crypto');
const { pool } = require('../db');

const SECRETS = {
  cpx: process.env.CPX_SECRET || 'secret123',
  lootably: process.env.LOOTABLY_SECRET || 'secret123',
};

const verifyPostback = (offerwall, query) => {
  switch (offerwall) {
    case 'cpx': {
      const hashString = `${query.trans_id}-${SECRETS.cpx}`;
      const hash = crypto.createHash('md5').update(hashString).digest('hex');
      return hash === query.hash;
    }
    case 'lootably':
      return query.secret === SECRETS.lootably;
    default:
      return false;
  }
};

const processConversion = async (offerwall, userId, amount, transactionId, ip) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency check
    const checkTx = await client.query('SELECT id FROM conversions WHERE transaction_id = $1', [transactionId]);
    if (checkTx.rows.length > 0) {
      await client.query('ROLLBACK');
      throw new Error('Transaction already processed');
    }

    await client.query(
      'INSERT INTO conversions (user_id, offerwall, offer_id, amount, transaction_id, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, offerwall, 'postback_offer', amount, transactionId, ip]
    );

    const result = await client.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1 WHERE id = $2 RETURNING referred_by',
      [amount, userId]
    );

    const referredBy = result.rows[0]?.referred_by;
    if (referredBy) {
      const commission = amount * 0.10;
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1 WHERE id = $2',
        [commission, referredBy]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = { verifyPostback, processConversion };
