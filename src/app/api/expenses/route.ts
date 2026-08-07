import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month"); 
    
    if (!monthStr) {
      return NextResponse.json({ error: "Month is required" }, { status: 400 });
    }

    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { dueDate: { gte: startDate, lte: endDate } },
          { competenceDate: { gte: startDate, lte: endDate } }
        ]
      },
      include: {
        category: true,
        subcategory: true,
        series: true,
        reconciliations: {
          include: { transaction: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const settings = await prisma.setting.findMany({
      where: { 
        OR: [
          { key: { startsWith: 'card_settings_' } },
          { key: { startsWith: 'rename_' } }
        ]
      }
    });
    const cardSettings: Record<string, any> = {};
    const renameSettings: Record<string, string> = {};
    for (const s of settings) {
      if (s.key.startsWith('card_settings_')) {
        try { cardSettings[s.key.replace('card_settings_', '')] = JSON.parse(s.value); } catch {}
      } else if (s.key.startsWith('rename_')) {
        renameSettings[s.key.replace('rename_', '')] = s.value;
      }
    }

    const allInstallments = await prisma.transaction.findMany({
      where: {
        totalInstallments: { gt: 1 }
      },
      include: {
        categoryRelation: true,
        account: {
          include: { creditCards: true }
        },
        creditCard: true
      },
      orderBy: { date: 'asc' }
    });

    const purchaseGroups = new Map<string, typeof allInstallments[0]>();
    for (const tx of allInstallments) {
      let closingDayNum = 25;
      const customConfig = cardSettings[tx.account?.externalId || ''] || {};
      if (customConfig.closingDay) {
        closingDayNum = customConfig.closingDay;
      } else if (tx.creditCard) {
         closingDayNum = tx.creditCard.closingDay || (tx.creditCard.dueDay ? tx.creditCard.dueDay - 9 : 25);
      } else if (tx.account && tx.account.creditCards && tx.account.creditCards.length > 0) {
         const cc = tx.account.creditCards[0];
         closingDayNum = cc.closingDay || (cc.dueDay ? cc.dueDay - 9 : 25);
      }
      if (closingDayNum <= 0) closingDayNum += 30; 

      const txDate = new Date(tx.date);
      let txYear = txDate.getFullYear();
      let txMonth = txDate.getMonth() + 1;
      if (txDate.getDate() > closingDayNum) {
        txMonth += 1;
        if (txMonth > 12) {
          txMonth = 1;
          txYear += 1;
        }
      }

      const originMonth = (txYear * 12 + txMonth) - (tx.installmentNumber || 1);
      const cleanDesc = tx.originalDescription.replace(/\s*\d+\/\d+\s*$/, '').trim().substring(0, 10).toLowerCase();
      const signature = `${tx.creditCardId || tx.accountId}-${cleanDesc}-${tx.totalInstallments}-${Math.round(Math.abs(tx.amount))}-${originMonth}`;
      
      const existing = purchaseGroups.get(signature);
      if (!existing || (tx.installmentNumber || 0) > (existing.installmentNumber || 0)) {
        purchaseGroups.set(signature, tx);
      }
    }

    const pseudoExpenses = [];
    for (const [signature, tx] of purchaseGroups.entries()) {
      let closingDayNum = 25;
      const customConfig = cardSettings[tx.account?.externalId || ''] || {};
      
      if (customConfig.closingDay) {
        closingDayNum = customConfig.closingDay;
      } else if (tx.creditCard) {
         closingDayNum = tx.creditCard.closingDay || (tx.creditCard.dueDay ? tx.creditCard.dueDay - 9 : 25);
      } else if (tx.account && tx.account.creditCards && tx.account.creditCards.length > 0) {
         const cc = tx.account.creditCards[0];
         closingDayNum = cc.closingDay || (cc.dueDay ? cc.dueDay - 9 : 25);
      }
      if (closingDayNum <= 0) closingDayNum += 30; 

      const txDate = new Date(tx.date);
      let txYear = txDate.getFullYear();
      let txMonth = txDate.getMonth() + 1;
      const txDay = txDate.getDate();

      if (txDay > closingDayNum) {
        txMonth += 1;
        if (txMonth > 12) {
          txMonth = 1;
          txYear += 1;
        }
      }
      
      const monthDiff = (year - txYear) * 12 + (month - txMonth);
      const projectedInstallment = (tx.installmentNumber || 1) + monthDiff;

      if (projectedInstallment > 0 && projectedInstallment <= (tx.totalInstallments || 1)) {
        if (monthDiff === 0 && tx.isReconciled) {
          continue; // Já foi conciliada neste mês exato
        }

        const customName = renameSettings[signature];
        const cleanDescForTitle = customName || tx.originalDescription.replace(/\s*\d+\/\d+\s*$/, '').trim();
        const targetDate = monthDiff === 0 ? tx.date : new Date(year, month - 1, txDate.getDate());

        pseudoExpenses.push({
          id: `proj-${signature}`,
          title: `${cleanDescForTitle} (Parcela ${projectedInstallment}/${tx.totalInstallments})`,
          amount: Math.abs(tx.amount),
          dueDate: targetDate,
          competenceDate: targetDate,
          categoryId: tx.categoryId,
          category: tx.categoryRelation ? {
            id: tx.categoryRelation.id,
            name: tx.categoryRelation.name,
            color: tx.categoryRelation.color
          } : null,
          series: { type: 'INSTALLMENT' },
          reconciliations: [],
          isPluggyInstallment: true,
          transactionData: {
            originalCategory: tx.category,
            cardNumber: tx.cardNumber
          }
        });
      }
    }

    const combined = [...expenses, ...pseudoExpenses].sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return NextResponse.json({ expenses: combined });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, description, amount, dueDate, competenceDate,
      type, frequency, installments, startDate, endDate,
      categoryId, subcategoryId, tags, supplier, costCenter, project,
      paymentMethod, accountId, creditCardId, notes
    } = body;

    // Se for Única
    if (type === 'SINGLE') {
      const expense = await prisma.expense.create({
        data: {
          title, description, amount, dueDate: new Date(dueDate),
          competenceDate: competenceDate ? new Date(competenceDate) : null,
          categoryId, subcategoryId, tags, supplier, costCenter, project,
          paymentMethod, accountId, creditCardId, notes
        }
      });
      return NextResponse.json(expense);
    }

    // Se for Série (Recorrente ou Parcelada)
    if (type === 'RECURRING' || type === 'INSTALLMENT') {
      const series = await prisma.expenseSeries.create({
        data: {
          type, title, description, baseAmount: type === 'RECURRING' ? amount : null,
          totalAmount: type === 'INSTALLMENT' ? amount * (installments || 1) : null,
          installments, frequency, startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          categoryId, subcategoryId, tags, supplier, costCenter, project,
          paymentMethod, accountId, creditCardId
        }
      });

      // Gerar as despesas filhas (Expenses)
      const expensesToCreate = [];
      const numInstallments = type === 'INSTALLMENT' ? installments : 12; // Se for infinito, gera 12 meses inicialmente (ou depende da lógica)
      
      let currentDate = new Date(startDate);
      for (let i = 1; i <= numInstallments; i++) {
        expensesToCreate.push({
          seriesId: series.id,
          title: type === 'INSTALLMENT' ? `${title} (${i}/${installments})` : title,
          description,
          amount,
          dueDate: new Date(currentDate),
          competenceDate: new Date(currentDate),
          installmentNum: type === 'INSTALLMENT' ? i : null,
          categoryId, subcategoryId, tags, supplier, costCenter, project,
          paymentMethod, accountId, creditCardId, notes
        });
        
        // Avançar a data (simplificado para MENSAL)
        if (frequency === 'MONTHLY' || type === 'INSTALLMENT') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (frequency === 'WEEKLY') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (frequency === 'YEARLY') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
      }

      await prisma.expense.createMany({ data: expensesToCreate });
      return NextResponse.json({ series });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
