const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'khaledabdelazim250@gmail.com',
    password: 'khaled45'
  });
  if (error) console.log('ERROR:', error.message);
  else console.log('SUCCESS! User ID:', data.user.id);
  process.exit();
}
test();
