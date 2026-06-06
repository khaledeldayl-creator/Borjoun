const db = require('./db');
const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('Usage: node promote_admin.js <email> [role]');
  process.exit(1);
}

db.query('UPDATE users SET role = $1 WHERE email = $2 RETURNING username, email, role', [role, email])
  .then(res => {
    if (res.rows.length === 0) {
      console.log(`Error: No user found in database with email: ${email}`);
    } else {
      console.log('User promoted successfully:', JSON.stringify(res.rows[0], null, 2));
    }
    process.exit(0);
  })
  .catch(e => {
    console.error('Failed to promote user:', e);
    process.exit(1);
  });
