export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function POST(request: NextRequest) {
  try {
    const { cardId, dueDay, closingDay, waiverTarget, feeAmount, customName } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'cardId é obrigatório' }, { status: 400 });
    }

    const key = `card_settings_${cardId}`;
    const value = JSON.stringify({ dueDay, closingDay, waiverTarget, feeAmount, customName });

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
