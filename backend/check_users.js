const db = require('./db');

async function check() {
  try {
    const authRes = await db.query('SELECT id, email, email_confirmed_at FROM auth.users');
    const pubRes = await db.query('SELECT id, email, role FROM public.users');
    
    console.log('--- AUTH USERS ---');
    console.log(authRes.rows);
    console.log('--- PUBLIC USERS ---');
    console.log(pubRes.rows);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit();
}
check();
