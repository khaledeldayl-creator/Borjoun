const db = require('./db');
async function test() {
  try {
    const res = await db.query("UPDATE auth.users SET encrypted_password = crypt('khaled45', gen_salt('bf')) WHERE email = 'khaled20220143@gmail.com' RETURNING email");
    console.log('Password reset for:', res.rows);
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit();
}
test();
