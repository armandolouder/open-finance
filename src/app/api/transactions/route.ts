export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Mês de referência: YYYY-MM (default = mês atual)
    const today = new Date();
    const monthParam = searchParams.get('month') ??
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [year, month] = monthParam.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // último dia do mês

    const allTransactions: any[] = [];

    const dbAccounts = await prisma.account.findMany({
      where: {
        type: 'BANK' // Apenas contas bancárias, como antes
      },
      include: {
        transactions: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            categoryRelation: true,
            subcategoryRelation: true
          }
        }
      }
    });

    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'account_settings_' } }
    });
    
    const accountSettings: Record<string, { customName?: string }> = {};
    for (const s of settings) {
      try {
        accountSettings[s.key.replace('account_settings_', '')] = JSON.parse(s.value);
      } catch {}
    }

    for (const account of dbAccounts) {
      const accSettings = accountSettings[account.externalId] || {};
      for (const t of account.transactions) {
        allTransactions.push({
          id: t.id,
          externalId: t.externalId,
          description: t.originalDescription,
          amount: t.amount,
          date: t.date.toISOString(),
          type: (t.amount > 0 ? 'CREDIT' : 'DEBIT'),
          transactionType: t.type,
          categoryId: t.categoryId,
          subcategoryId: t.subcategoryId,
          categoryName: t.categoryRelation?.name || null,
          subcategoryName: t.subcategoryRelation?.name || null,
          tags: t.tags || "",
          isReconciled: t.isReconciled,
          accountName: accSettings.customName || account.name,
          accountId: account.externalId,
          balance: t.balance, 
        });
      }
    }

    // Ordenar por data decrescente
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalIn = allTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalOut = allTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    return NextResponse.json({
      transactions: allTransactions,
      month: monthParam,
      summary: { totalIn, totalOut, balance: totalIn - totalOut, count: allTransactions.length },
    });

  } catch (error: any) {
    console.error('Erro geral /api/transactions:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
