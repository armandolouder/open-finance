import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const dbAccounts = await prisma.account.findMany({
      where: { type: 'BANK' },
      include: {
        transactions: {
          where: {
            date: { gte: ninetyDaysAgo },
            direction: 'DEBIT', // We only care about leaks (debits)
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

    const allDebits: any[] = [];
    for (const account of dbAccounts) {
      const accSettings = accountSettings[account.externalId] || {};
      for (const t of account.transactions) {
        allDebits.push({
          id: t.externalId,
          description: t.description,
          amount: Math.abs(t.amount),
          date: t.date.toISOString(),
          category: t.category,
          accountName: accSettings.customName || account.name,
        });
      }
    }

    // Heuristics
    const feeKeywords = ['anuidade', 'tarifa', 'manuten', 'saque', 'iof', 'juros', 'mora', 'multa'];
    const dropsKeywords = ['ifood', 'uber', '99', 'mcdonalds', 'bk ', 'starbucks', 'zé delivery', 'rappi', 'ze delivery'];
    const subKeywords = ['netflix', 'spotify', 'amazon', 'prime', 'hbo', 'disney', 'apple', 'google'];

    const matchesKeyword = (desc: string, keywords: string[]) => {
      const d = desc.toLowerCase();
      return keywords.some(k => d.includes(k));
    };

    const fees = allDebits.filter(t => matchesKeyword(t.description, feeKeywords) || t.category?.toLowerCase().includes('taxa'));
    const drops = allDebits.filter(t => matchesKeyword(t.description, dropsKeywords) || t.category?.toLowerCase() === 'delivery' || t.category?.toLowerCase().includes('transporte app'));
    const subs = allDebits.filter(t => matchesKeyword(t.description, subKeywords));

    // Remove duplicates across categories (if any) prioritizing fees > subs > drops
    const usedIds = new Set();
    
    const dedup = (items: any[]) => {
      return items.filter(i => {
        if (usedIds.has(i.id)) return false;
        usedIds.add(i.id);
        return true;
      });
    };

    const finalFees = dedup(fees);
    const finalSubs = dedup(subs);
    const finalDrops = dedup(drops);

    // Sort descending by date
    finalFees.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    finalSubs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    finalDrops.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals
    const sum = (items: any[]) => items.reduce((acc, i) => acc + i.amount, 0);

    return NextResponse.json({
      totalLeaked: sum(finalFees) + sum(finalDrops) + sum(finalSubs),
      fees: { items: finalFees, total: sum(finalFees) },
      drops: { items: finalDrops, total: sum(finalDrops) },
      subscriptions: { items: finalSubs, total: sum(finalSubs) },
      periodDays: 90
    });
  } catch (error: any) {
    console.error('Erro na Torneira API:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
