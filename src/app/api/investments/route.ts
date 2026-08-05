export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPluggyClient } from '@/services/pluggy/client';

export async function GET() {
  try {
    const pluggy = getPluggyClient();
    const itemIdsStr = process.env.PLUGGY_ITEM_IDS || '';
    const itemIds = itemIdsStr.split(',').map(id => id.trim()).filter(Boolean);

    const allInvestments = [];

    for (const itemId of itemIds) {
      try {
        const [item, investments] = await Promise.all([
          pluggy.fetchItem(itemId),
          pluggy.fetchInvestments(itemId),
        ]);

        for (const inv of investments) {
          allInvestments.push({
            ...inv,
            institutionName: item.connector?.name ?? 'Desconhecida',
            institutionLogo: item.connector?.imageUrl ?? null,
            connectorName: item.connector?.name ?? '',
          });
        }
      } catch (err: any) {
        console.error(`Erro ao buscar investimentos do item ${itemId}:`, err.message);
      }
    }

    const totalValue = allInvestments.reduce((sum, i) => sum + (i.value ?? i.balance ?? 0), 0);
    const totalGain = allInvestments.reduce((sum, i) => sum + (i.gains ?? i.annualRate ?? 0), 0);

    return NextResponse.json({
      investments: allInvestments,
      summary: { totalValue, totalGain }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
