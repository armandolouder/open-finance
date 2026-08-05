const { PluggyClient } = require('pluggy-sdk');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new PluggyClient({
    clientId: process.env.PLUGGY_CLIENT_ID,
    clientSecret: process.env.PLUGGY_CLIENT_SECRET
  });
  const res = await client.fetchConnectors({ name: 'Santander' });
  console.log(res.results.map(r => ({ name: r.name, imageUrl: r.imageUrl })));
}
run();
