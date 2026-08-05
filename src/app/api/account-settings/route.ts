import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function POST(request: Request) {
  try {
    const { accountId, settings } = await request.json();

    if (!accountId || !settings) {
      return NextResponse.json({ error: 'Missing accountId or settings' }, { status: 400 });
    }

    const key = `account_settings_${accountId}`;

    const existing = await prisma.setting.findUnique({ where: { key } });

    let finalSettings = { ...settings };

    if (existing) {
      try {
        const parsed = JSON.parse(existing.value);
        finalSettings = { ...parsed, ...settings };
      } catch {}
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(finalSettings) },
      create: { key, value: JSON.stringify(finalSettings) }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
