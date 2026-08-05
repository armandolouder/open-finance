export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'ALL'; // 'ALL', 'PF', 'PJ'

    // Get settings to classify accounts
    const settings = await prisma.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'account_label_' } },
          { key: { startsWith: 'item_name_' } },
          { key: { startsWith: 'card_settings_' } },
          { key: { startsWith: 'account_settings_' } }
        ]
      }
    });
    
    const accountTypes: Record<string, 'PF' | 'PJ'> = {};
    const customItemNames: Record<string, string> = {};
    const cardSettings: Record<string, { dueDay?: number, closingDay?: number }> = {};
    const accountSettings: Record<string, { investments?: number, type?: string, customName?: string, customColor?: string }> = {};
    
    for (const s of settings) {
      if (s.key.startsWith('account_label_')) {
        const accId = s.key.replace('account_label_', '');
        try {
          const val = JSON.parse(s.value);
          if (val.type === 'PF' || val.type === 'PJ') {
            accountTypes[accId] = val.type;
          }
        } catch {}
      } else if (s.key.startsWith('item_name_')) {
        const itemId = s.key.replace('item_name_', '');
        customItemNames[itemId] = s.value;
      } else if (s.key.startsWith('card_settings_')) {
        try {
          cardSettings[s.key.replace('card_settings_', '')] = JSON.parse(s.value);
        } catch {}
      } else if (s.key.startsWith('account_settings_')) {
        try {
          accountSettings[s.key.replace('account_settings_', '')] = JSON.parse(s.value);
        } catch {}
      }
    }

    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let proLabore = 0;
    
    const accountsData: any[] = [];
    const allRecentTransactions: any[] = [];
    const expensesByCategoryMap: Record<string, { amount: number, sources: Set<string> }> = {};

    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const dbAccounts = await prisma.account.findMany({
      include: {
        connection: true,
        transactions: true,
        creditCards: true
      }
    });

    // Handle investments summary if needed (since it's from API in original, we can mock or remove for now, or just default to 0 if not set in manual settings)
    const pluggyInvestmentsTotal = 0; 
    let assignedPluggyInvestments = false;

    for (const account of dbAccounts) {
      const accSettings = accountSettings[account.externalId] || {};
      const customConfig = cardSettings[account.externalId] || {};
      const customName = accSettings.customName || customConfig.customName || account.name;
      
      let type = accSettings.type || accountTypes[account.externalId];
      if (!type) {
        const n = account.name.toLowerCase();
        type = (n.includes('company') || n.includes('empresa') || n.includes('pj') || n.includes('business')) ? 'PJ' : 'PF';
      }
      
      if (filter !== 'ALL' && type !== filter) {
        continue;
      }

      let investments = 0;
      if (accSettings.investments !== undefined) {
        investments = accSettings.investments as number;
      } else if (account.type === 'BANK' && !assignedPluggyInvestments) {
        investments = pluggyInvestmentsTotal;
        assignedPluggyInvestments = true;
      }

      const creditData = account.creditCards ? account.creditCards[0] : null;
      const institutionName = customItemNames[account.connection.externalItemId] || account.connection.institutionName || 'Desconhecida';

      accountsData.push({
        id: account.externalId,
        name: customName,
        balance: account.balance,
        type: account.type,
        subtype: account.subtype,
        institution: institutionName,
        accountType: type,
        brand: 'MASTERCARD', 
        level: null,
        balanceCloseDate: null,
        balanceDueDate: null,
        availableCreditLimit: creditData?.availableLimit,
        minimumPayment: null,
        investments,
        customColor: accSettings.customColor
      });

      if (account.type === 'BANK') {
        totalBalance += (account.balance || 0);
      }

      if (account.type === 'BANK' || account.type === 'CREDIT') {
        const transactions = account.transactions;
        const customConfig = cardSettings[account.externalId] || {};
        let closingDayNum = customConfig.closingDay ?? creditData?.closingDay;
        
        if (!closingDayNum && creditData?.dueDay) {
           closingDayNum = creditData.dueDay - 9;
           if (closingDayNum <= 0) closingDayNum += 30;
        }

        for (const tx of transactions) {
          let txMonth = tx.date.toISOString().slice(0, 7);
          
          if (account.type === 'CREDIT') {
            const txDate = tx.date;
            const txYear = txDate.getFullYear();
            const txMonthNum = txDate.getMonth();
            const txDay = txDate.getDate();

            if (tx.billForecastDate && !account.name.toLowerCase().includes('santander')) {
              txMonth = tx.billForecastDate.slice(0, 7);
            } else {
              const currentClosingDay = closingDayNum || 25;
              if (txDay > currentClosingDay) {
                const nextMonth = new Date(txYear, txMonthNum + 1, 1);
                txMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
              } else {
                txMonth = `${txYear}-${String(txMonthNum + 1).padStart(2, '0')}`;
              }
            }
          }

          if (txMonth !== currentMonthStr) continue;

          const desc = (tx.description || '').toLowerCase();
          
          // Ignore credit card payments
          if (tx.category === 'Credit card payment' || desc.includes('pagamento recebido') || desc.includes('pagamento de fatura') || desc.includes('fatura paga')) {
            continue;
          }

          if (tx.direction === 'CREDIT') {
            totalIncome += tx.amount;
            if (account.type === 'PF' && (desc.includes('pro-labore') || desc.includes('pro labore'))) {
              proLabore += tx.amount;
            }
          } else {
            totalExpense += Math.abs(tx.amount);
            
            const cat = tx.category || 'Outros';
            
            if (!expensesByCategoryMap[cat]) {
              expensesByCategoryMap[cat] = { amount: 0, sources: new Set() };
            }
            
            expensesByCategoryMap[cat].amount += Math.abs(tx.amount);
            
            let sourceStr = customName;
            if (account.type === 'CREDIT') {
              const customDueDay = customConfig.dueDay || creditData?.dueDay;
              if (customDueDay) {
                const parts = currentMonthStr.split('-');
                sourceStr += ` | Venc.${String(customDueDay).padStart(2, '0')}/${parts[1]}`;
              } else {
                sourceStr += ` | Cartão`;
              }
            }
            expensesByCategoryMap[cat].sources.add(sourceStr.toUpperCase());
          }
          
          allRecentTransactions.push({
            id: tx.externalId,
            description: tx.description,
            date: tx.date.toISOString(),
            amount: tx.amount,
            type: tx.direction,
            institution: institutionName,
            accountName: customName,
            category: tx.category || 'Outros'
          });
        }
      }
    }

    // Sort transactions by date descending and take top 15
    allRecentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentTransactions = allRecentTransactions.slice(0, 15);

    // Fetch visible categories to whitelist them in the taxonomy
    const visibleCategories = await prisma.category.findMany({
      where: { showOnHome: true },
      select: { name: true }
    });
    const visibleSet = new Set(visibleCategories.map((c: any) => c.name.toLowerCase()));

    const expensesByCategory = Array.from(visibleSet).map((categoryName) => {
      const originalCat = visibleCategories.find((c: any) => c.name.toLowerCase() === categoryName);
      const displayName = originalCat ? originalCat.name : categoryName.toUpperCase();
      
      let amount = 0;
      let sources = new Set<string>();
      
      for (const [key, val] of Object.entries(expensesByCategoryMap)) {
        if (key.toLowerCase() === categoryName) {
          amount += val.amount;
          val.sources.forEach(s => sources.add(s));
        }
      }
      return { category: displayName, amount, sources: Array.from(sources) };
    }).sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      totalBalance,
      totalIncome,
      totalExpense,
      proLabore,
      accounts: accountsData,
      recentTransactions,
      expensesByCategory
    });

  } catch (error: any) {
    console.error('Erro /api/dashboard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
