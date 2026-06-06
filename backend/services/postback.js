const crypto = require('crypto');
const db = require('../db');

// Add your offerwall secret keys here
const SECRETS = {
  cpx: process.env.CPX_SECRET || 'secret123',
  lootably: process.env.LOOTABLY_SECRET || 'secret123',
};

const verifyPostback = (offerwall, query) => {
  switch (offerwall) {
    case 'cpx':
      // Example MD5 hash for CPX Research
      const hashString = `${query.trans_id}-${SECRETS.cpx}`;
      const hash = crypto.createHash('md5').update(hashString).digest('hex');
      return hash === query.hash;
    case 'lootably':
      // Example Lootably hash
      return query.secret === SECRETS.lootably;
    default:
      return false;
  }
};

const processConversion = async (offerwall, userId, amount, transactionId, ip) => {
  const client = await db.query('BEGIN'); // Using standard client would be better for transactions, but we can do a simple version
  try {
    // Check if tx exists
    const checkTx = await db.query('SELECT id FROM conversions WHERE transaction_id = $1', [transactionId]);
    if (checkTx.rows.length > 0) {
      throw new Error('Transaction already processed');
    }

    // Insert conversion
    await db.query(
      'INSERT INTO conversions (user_id, offerwall, offer_id, amount, transaction_id, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, offerwall, 'postback_offer', amount, transactionId, ip]
    );

    // Update wallet
    const result = await db.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1 WHERE id = $2 RETURNING referred_by',
      [amount, userId]
    );

    // Process Referral Commission (10%)
    const referredBy = result.rows[0]?.referred_by;
    if (referredBy) {
      const commission = amount * 0.10;
      await db.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1, total_earned = total_earned + $1 WHERE id = $2',
        [commission, referredBy]
      );
    }

    await db.query('COMMIT');
    return true;
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
};

module.exports = { verifyPostback, processConversion };
