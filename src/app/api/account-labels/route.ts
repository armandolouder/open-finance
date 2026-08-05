export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

// GET /api/account-labels - retorna todos os apelidos salvos
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'account_label_' } }
    });

    const labels: Record<string, { customName: string; entityType: string }> = {};
    for (const s of settings) {
      const accountId = s.key.replace('account_label_', '');
      try {
        labels[accountId] = JSON.parse(s.value);
      } catch {}
    }

    return NextResponse.json(labels);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/account-labels - salva ou atualiza um apelido
export async function POST(request: NextRequest) {
  try {
    const { accountId, customName, entityType } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'accountId é obrigatório' }, { status: 400 });
    }

    const key = `account_label_${accountId}`;
    const value = JSON.stringify({ customName: customName || '', entityType: entityType || 'PF' });

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
