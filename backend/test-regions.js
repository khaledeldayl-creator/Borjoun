const { Client } = require('pg');

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-west-1',
  'us-east-2',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-south-1',
  'sa-east-1'
];

async function testRegions() {
  console.log('Testing regions...');
  for (const region of regions) {
    const url = `postgresql://postgres.enkqzvbusppwktubxpwu:borjounoffers@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      console.log(`[SUCCESS] Region found! ${region}`);
      await client.end();
      return region;
    } catch (err) {
      if (!err.message.includes('tenant/user') && !err.message.includes('ENOTFOUND')) {
        console.log(`[PARTIAL] Region ${region} gave different error: ${err.message}`);
      }
    } finally {
      client.end().catch(()=>null);
    }
  }
  console.log('No region succeeded.');
}

testRegions();
