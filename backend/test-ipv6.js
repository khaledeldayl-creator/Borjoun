const { Client } = require('pg');

async function testV6() {
  const url = 'postgresql://postgres:borjounoffers@db.enkqzvbusppwktubxpwu.supabase.co:5432/postgres';
  // Try to connect, forcing ipv6 resolution if possible, though pg connection string doesn't expose dns options easily.
  // We can manually resolve and pass the IP.
  const dns = require('dns');
  dns.lookup('db.enkqzvbusppwktubxpwu.supabase.co', { family: 6 }, async (err, address) => {
    if (err) {
      console.error('DNS Lookup failed:', err.message);
      return;
    }
    console.log('Resolved to:', address);
    
    const client = new Client({
      host: address,
      port: 5432,
      user: 'postgres',
      password: 'borjounoffers',
      database: 'postgres',
    });
    
    try {
      await client.connect();
      console.log('Successfully connected via IPv6!');
      await client.end();
    } catch (e) {
      console.error('Connection failed:', e.message);
      if (e.message.includes('password')) {
         console.log('Password might be [borjounoffers] with brackets. Testing that...');
         const client2 = new Client({
           host: address, port: 5432, user: 'postgres', password: '[borjounoffers]', database: 'postgres'
         });
         try {
           await client2.connect();
           console.log('Successfully connected with brackets password!');
           await client2.end();
         } catch(e2) {
           console.error('Failed with brackets too:', e2.message);
         }
      }
    }
  });
}

testV6();
