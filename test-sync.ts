import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { POST } from './src/app/api/sync/route';

async function testSync() {
  const req = new Request('http://localhost:3000/api/sync', { method: 'POST' });
  const res = await POST();
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testSync().catch(console.error);
