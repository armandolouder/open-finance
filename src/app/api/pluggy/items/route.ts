export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';
import { getPluggyClient } from '@/services/pluggy/client';

export async function POST(req: Request) {
  try {
    const { itemId } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'itemId é obrigatório' }, { status: 400 });
    }

    const pluggyClient = getPluggyClient();
    const item = await pluggyClient.fetchItem(itemId);

    await prisma.connection.upsert({
      where: { externalItemId: itemId },
      update: {
        status: item.status,
        institutionName: item.connector?.name || 'Desconhecida',
      },
      create: {
        externalItemId: itemId,
        status: item.status,
        institutionName: item.connector?.name || 'Desconhecida',
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao salvar item na base de dados:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
