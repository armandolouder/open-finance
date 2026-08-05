import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import { prisma } from '@/services/db';

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['PLUGGY_CLIENT_ID', 'PLUGGY_CLIENT_SECRET'] } }
  });
  
  let clientId = process.env.PLUGGY_CLIENT_ID || '';
  let clientSecret = process.env.PLUGGY_CLIENT_SECRET || '';

  for (const s of settings) {
    if (s.key === 'PLUGGY_CLIENT_ID') clientId = s.value;
    if (s.key === 'PLUGGY_CLIENT_SECRET') clientSecret = s.value;
  }

  return NextResponse.json({
    clientId,
    hasSecret: !!clientSecret
  });
}

export async function POST(request: Request) {
  try {
    const { clientId, clientSecret } = await request.json();
    
    if (clientId !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'PLUGGY_CLIENT_ID' },
        update: { value: clientId },
        create: { key: 'PLUGGY_CLIENT_ID', value: clientId }
      });
    }
    
    if (clientSecret && clientSecret !== '••••••••••••••••') {
      await prisma.setting.upsert({
        where: { key: 'PLUGGY_CLIENT_SECRET' },
        update: { value: clientSecret },
        create: { key: 'PLUGGY_CLIENT_SECRET', value: clientSecret }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
