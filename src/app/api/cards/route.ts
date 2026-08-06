export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const today = new Date();
    // Mês da fatura: YYYY-MM (default = mês atual)
    const monthParam = searchParams.get('month') ??
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Load manual settings
    const settings = await prisma.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'card_settings_' } },
          { key: { startsWith: 'item_name_' } },
          { key: { startsWith: 'account_label_' } },
          { key: 'account_order' }
        ]
      }
    });
    const cardSettings: Record<string, { dueDay?: number, closingDay?: number, waiverTarget?: number, feeAmount?: number, customName?: string }> = {};
    const customItemNames: Record<string, string> = {};
    const accountLabels: Record<string, string> = {};
    let accountOrder: string[] = [];

    for (const s of settings) {
      if (s.key.startsWith('card_settings_')) {
        try {
          cardSettings[s.key.replace('card_settings_', '')] = JSON.parse(s.value);
        } catch {}
      } else if (s.key.startsWith('item_name_')) {
        customItemNames[s.key.replace('item_name_', '')] = s.value;
      } else if (s.key.startsWith('account_label_')) {
        try {
          const val = JSON.parse(s.value);
          if (val.customName) {
            accountLabels[s.key.replace('account_label_', '')] = val.customName;
          }
        } catch {}
      } else if (s.key === 'account_order') {
        try {
          accountOrder = JSON.parse(s.value);
        } catch {}
      }
    }

    const categories = await prisma.category.findMany();
    const categoryColors: Record<string, string> = {};
    categories.forEach((c: any) => {
      if (c.color) {
        categoryColors[c.name.toLowerCase()] = c.color;
      }
    });

    const cards: any[] = [];
    const dbCreditCards = await prisma.creditCard.findMany({
      include: {
        account: {
          include: {
            transactions: true
          }
        },
        entity: true
      }
    });

    for (const creditCard of dbCreditCards) {
      const account = creditCard.account;
      const transactions = account.transactions;
      const customConfig = cardSettings[account.externalId] || {};
      
      let closingDayNum = customConfig.closingDay ?? creditCard.closingDay;
      
      if (!closingDayNum && creditCard.dueDay) {
         closingDayNum = creditCard.dueDay - 9;
         if (closingDayNum <= 0) closingDayNum += 30; 
      }

      function getTxBillMonth(tx: any): string {
        const txDate = new Date(tx.date);
        const txYear = txDate.getFullYear();
        const txMonth = txDate.getMonth();
        const txDay = txDate.getDate();

        const currentClosingDay = closingDayNum || 25; 
        
        if (txDay > currentClosingDay) {
          const nextMonth = new Date(txYear, txMonth + 1, 1);
          return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
        }

        return `${txYear}-${String(txMonth + 1).padStart(2, '0')}`;
      }

      const monthTxns = transactions.filter(tx => {
        const m = getTxBillMonth(tx);
        return m === monthParam;
      });

      // Deduplicate transactions (e.g. Pluggy bug returning duplicate payments)
      const uniqueTxns: any[] = [];
      const seen = new Set();
      for (const tx of monthTxns) {
        // Create a unique key: date(YYYY-MM-DD) + amount + description
        const dayKey = tx.date.toISOString().slice(0, 10);
        const key = `${dayKey}_${tx.amount}_${tx.description.trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTxns.push(tx);
        }
      }

      // --- SMART INSTALLMENT PROJECTION ---
      // Se não recebemos as parcelas futuras da Pluggy (ex: Santander só mandou até Julho), 
      // nós projetamos matematicamente as próximas parcelas baseadas no totalInstallments.
      const instGroups = new Map<string, any>();
      for (const tx of transactions) {
        if (!tx.installmentNumber || !tx.totalInstallments || tx.totalInstallments <= 1) continue;
        const roundedAmount = Math.round(tx.amount);
        let key = '';
        if (tx.purchaseDate) {
          const pDate = typeof tx.purchaseDate === 'string' ? tx.purchaseDate : tx.purchaseDate.toISOString();
          key = `${pDate.slice(0, 10)}_${roundedAmount}_${tx.totalInstallments}`;
        } else {
          const cleanDesc = tx.description.replace(/\s*(?:-\s*)?(?:PARC\.?\s*)?\(?\d{1,2}\/\d{1,2}\)?$/i, '').trim();
          key = `${cleanDesc}_${roundedAmount}_${tx.totalInstallments}`;
        }
        if (!instGroups.has(key) || tx.installmentNumber > instGroups.get(key).installmentNumber) {
          instGroups.set(key, { ...tx, billMonthStr: getTxBillMonth(tx) });
        }
      }

      const [paramYear, paramMonth] = monthParam.split('-').map(Number);
      
      for (const [key, highest] of instGroups.entries()) {
        const [hYear, hMonth] = highest.billMonthStr.split('-').map(Number);
        const diff = (paramYear - hYear) * 12 + (paramMonth - hMonth);
        
        if (diff > 0) {
          const projectedInst = highest.installmentNumber + diff;
          if (projectedInst <= highest.totalInstallments) {
            // A parcela desse mês está faltando no DB! Vamos projetá-la.
            const projTx = {
               ...highest,
               id: `proj_${highest.id}_${projectedInst}`,
               externalId: `proj_${highest.externalId}_${projectedInst}`,
               installmentNumber: projectedInst,
               isProjected: true
            };
            uniqueTxns.push(projTx);
          }
        }
      }
      // ------------------------------------

      const total = uniqueTxns.reduce((s: number, t: any) => {
        const isPayment = t.category?.toLowerCase() === 'credit card payment' || 
                          t.description?.toLowerCase().includes('pagamento');
        if (isPayment) {
          return s;
        }
        return s + t.amount;
      }, 0);

      const bills = [{
        month: monthParam,
        label: formatMonthLabel(monthParam),
        total,
        transactions: uniqueTxns
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((tx: any) => ({
            id: tx.externalId,
            description: tx.description,
            amount: tx.amount,
            date: tx.date.toISOString(),
            purchaseDate: tx.purchaseDate ? tx.purchaseDate.toISOString() : tx.date.toISOString(),
            category: tx.category,
            categoryColor: tx.category ? (categoryColors[tx.category.toLowerCase()] || '#ccc') : '#ccc',
            cardNumber: tx.cardNumber,
            totalInstallments: tx.totalInstallments,
            installmentNumber: tx.installmentNumber,
            type: tx.direction,
            isManual: tx.isManual,
          })),
      }];

      const finalDueDay = customConfig.dueDay ? String(customConfig.dueDay).padStart(2, '0') : (creditCard.dueDay ? String(creditCard.dueDay).padStart(2, '0') : null);
      const finalClosingDay = customConfig.closingDay ? String(customConfig.closingDay).padStart(2, '0') : (creditCard.closingDay ? String(creditCard.closingDay).padStart(2, '0') : null);

      let overrideDueDate = null;
      if (finalDueDay) {
        overrideDueDate = `${monthParam}-${finalDueDay}`;
      }

      let overrideClosingDate = null;
      if (finalClosingDay) {
        let closingMonth = monthParam;
        if (parseInt(finalClosingDay) > (finalDueDay ? parseInt(finalDueDay) : 31)) {
          const parts = monthParam.split('-');
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 2, 1);
          closingMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        overrideClosingDate = `${closingMonth}-${finalClosingDay}`;
      }

      cards.push({
        id: account.externalId,
        name: accountLabels[account.externalId] || customConfig.customName || creditCard.name,
        institution: creditCard.institutionName || 'Desconhecida',
        institutionLogo: null, 
        brand: 'MASTERCARD', 
        level: null, // Update this later if we add level to db
        balance: account.balance,
        availableLimit: creditCard.availableLimit ?? null,
        creditLimit: creditCard.creditLimit ?? null,
        closingDate: overrideClosingDate,
        dueDate: overrideDueDate,
        waiverTarget: customConfig.waiverTarget ?? null,
        feeAmount: customConfig.feeAmount ?? null,
        bills,
        settings: customConfig,
      });
    }

    if (accountOrder.length > 0) {
      cards.sort((a, b) => {
        let indexA = accountOrder.indexOf(a.id);
        let indexB = accountOrder.indexOf(b.id);
        if (indexA === -1) indexA = 9999;
        if (indexB === -1) indexB = 9999;
        return indexA - indexB;
      });
    }

    return NextResponse.json({ cards });
  } catch (error: any) {
    console.error('Erro geral /api/cards:', error.stack || error.message);
    return NextResponse.json(
      { error: 'Falha ao buscar cartões locais', details: error.message },
      { status: 500 }
    );
  }
}

function formatMonthLabel(yyyyMM: string) {
  const [year, month] = yyyyMM.split('-');
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[parseInt(month) - 1]} De ${year}`;
}
