export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

// GET /api/account-order - retorna a ordem
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'account_order' }
    });

    return NextResponse.json({ order: setting ? JSON.parse(setting.value) : [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/account-order - salva a ordem dos accounts
export async function POST(request: NextRequest) {
  try {
    const { order } = await request.json(); // Array de accountIds (externalId)

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const key = 'account_order';
    const value = JSON.stringify(order);

    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
