async function testEndpoints() {
  const endpoints = [
    'http://localhost:3000/api/dashboard',
    'http://localhost:3000/api/cards',
    'http://localhost:3000/api/accounts',
    'http://localhost:3000/api/transactions'
  ];

  for (const url of endpoints) {
    try {
      console.log(`\nTesting ${url}...`);
      const res = await fetch(url);
      const text = await res.text();
      
      if (!res.ok) {
        console.error(`ERROR ${res.status}:`, text);
      } else {
        console.log(`SUCCESS ${res.status}: Data length = ${text.length}`);
      }
    } catch (e) {
      console.error(`Fetch failed for ${url}:`, e.message);
    }
  }
}

testEndpoints().catch(console.error);
