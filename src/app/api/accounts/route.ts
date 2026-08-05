export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'item_name_' } }
    });
    const customItemNames: Record<string, string> = {};
    for (const s of settings) {
      customItemNames[s.key.replace('item_name_', '')] = s.value;
    }

    const dbAccounts = await prisma.account.findMany({
      include: {
        connection: true,
        creditCards: true,
        transactions: {
          where: {
            totalInstallments: { gt: 1 }
          }
        }
      }
    });

    const allAccounts = [];

    for (const account of dbAccounts) {
      let totalInstallments: number | null = null;
      const itemId = account.connection.externalItemId;
      const institutionName = customItemNames[itemId] || account.connection.institutionName || 'Desconhecida';

      if (account.type === 'CREDIT') {
        try {
          let sum = 0;
          for (const tx of account.transactions) {
            const total = tx.totalInstallments;
            const current = tx.installmentNumber;
            const amount = Math.abs(tx.amount ?? 0);
            if (total && current && total > 1) {
              const remaining = total - current;
              if (remaining > 0) {
                sum += (amount / total) * remaining;
              }
            }
          }
          totalInstallments = sum;
        } catch {
        }
      }

      const creditData = account.creditCards ? account.creditCards[0] : null;

      allAccounts.push({
        id: account.externalId,
        itemId,
        institutionName,
        institutionLogo: null, 
        name: account.name,
        number: '', // not stored
        type: account.type,
        subtype: account.subtype,
        balance: account.balance ?? 0,
        currencyCode: account.currency ?? 'BRL',
        totalInstallments,
        creditData: creditData ? {
          creditLimit: creditData.creditLimit ?? 0,
          balance: account.balance ?? 0,
          availableCreditLimit: creditData.availableLimit ?? 0,
        } : null,
      });
    }

    const bankAccounts = allAccounts.filter(a => a.type === 'BANK');
    const creditAccounts = allAccounts.filter(a => a.type === 'CREDIT');
    const investmentAccounts = allAccounts.filter(a => a.type === 'INVESTMENT');

    const totalBalance = bankAccounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
    const totalCreditLimit = creditAccounts.reduce((sum, a) => sum + (a.creditData?.creditLimit ?? 0), 0);
    const totalCreditUsed = creditAccounts.reduce((sum, a) => sum + (a.creditData?.balance ?? 0), 0);
    const totalInvestments = investmentAccounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

    const syncingConnections = await prisma.connection.findMany({
      where: {
        accounts: {
          none: {}
        }
      }
    });

    return NextResponse.json({
      accounts: allAccounts,
      syncingConnections: syncingConnections.map(c => ({
        id: c.id,
        itemId: c.externalItemId,
        institutionName: c.institutionName,
        status: c.status,
      })),
      summary: {
        totalBalance,
        totalCreditLimit,
        totalCreditUsed,
        totalInvestments,
        totalAssets: totalBalance + totalInvestments,
      }
    });

  } catch (error: any) {
    console.error('Erro /api/accounts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
