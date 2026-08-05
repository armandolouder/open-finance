export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPluggyClient } from '@/services/pluggy/client';
import { prisma } from '@/services/db';

export async function GET() {
  try {
    const pluggy = await getPluggyClient();
    const connections = await prisma.connection.findMany();
    const itemIds = connections.map(c => c.externalItemId);

    const allInvestments: any[] = [];

    // 1. Fetch real investments from Pluggy
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

    // 2. Fetch manual investments from AccountSettings
    const accounts = await prisma.account.findMany({ include: { connection: true } });
    const settings = await prisma.setting.findMany({ 
      where: { 
        OR: [
          { key: { startsWith: 'account_settings_' } },
          { key: { startsWith: 'account_label_' } }
        ]
      } 
    });
    
    const accountSettings: Record<string, any> = {};
    const accountLabels: Record<string, any> = {};
    
    for (const s of settings) {
      try {
        if (s.key.startsWith('account_settings_')) {
          accountSettings[s.key.replace('account_settings_', '')] = JSON.parse(s.value);
        } else if (s.key.startsWith('account_label_')) {
          accountLabels[s.key.replace('account_label_', '')] = JSON.parse(s.value);
        }
      } catch {}
    }

    for (const account of accounts) {
      const invValue = accountSettings[account.externalId]?.investments;
      if (invValue && invValue > 0) {
        const customName = accountLabels[account.externalId]?.customName || account.name;
        
        allInvestments.push({
          id: `manual_${account.id}`,
          name: customName,
          type: 'MANUAL',
          value: invValue,
          balance: invValue,
          institutionName: account.connection.institutionName || 'Desconhecida',
          institutionLogo: null,
          connectorName: account.connection.institutionName || '',
        });
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
