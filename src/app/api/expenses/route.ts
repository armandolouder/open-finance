import { NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month"); // Format: YYYY-MM
    
    if (!monthStr) {
      return NextResponse.json({ error: "Month is required" }, { status: 400 });
    }

    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Fetch ignored categories
    const ignoredCategories = await prisma.category.findMany({
      where: { ignoreInTotals: true },
      select: { name: true }
    });
    const ignoredNames = ignoredCategories.map(c => c.name);

    // Get actual transactions for the month that are expenses (debits)
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        direction: 'DEBIT',
        category: {
          notIn: ['Transfer', 'Same person transfer', 'Credit Card Payment']
        },
        classification: {
          not: 'IGNORED'
        },
        description: {
          not: {
            startsWith: 'Transferência enviada'
          }
        }
      },
      include: { account: true }
    });

    // Get active recurring expenses to project
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        status: 'ACTIVE',
        startDate: {
          lte: endDate
        },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } }
        ]
      },
      include: { category: true, account: true, creditCard: true }
    });

    const projections: any[] = [];
    for (const re of recurringExpenses) {
      let hasRealMatch = transactions.some((t: any) => t.recurringExpenseId === re.id);
      
      if (!hasRealMatch && re.matchPattern) {
        hasRealMatch = transactions.some((t: any) => {
          const desc = t.description.toLowerCase();
          const patterns = re.matchPattern!.toLowerCase().split(',').map((p: string) => p.trim());
          return patterns.some((p: string) => p && desc.includes(p));
        });
      }

      if (hasRealMatch) {
        continue;
      }

      const projDate = new Date(year, month - 1, re.dayOfMonth || 1);
      projections.push({
        ...re,
        projectedDate: projDate,
        isProjected: true,
        title: re.title
      });
    }

    // Automatically project future installments from Pluggy API
    const pastInstallments = await prisma.transaction.findMany({
      where: {
        date: { lt: startDate },
        direction: 'DEBIT',
        totalInstallments: { gt: 1 },
        installmentNumber: { not: null }
      },
      include: { account: true }
    });

    const normalizeDesc = (desc: string) => desc.replace(/\s*\d+\/\d+\s*$/, '').trim().toLowerCase();
    const getCleanTitle = (desc: string) => desc.replace(/\s*\d+\/\d+\s*$/, '').trim();

    const latestInstallments = new Map<string, any>();
    for (const t of pastInstallments) {
      const key = `${normalizeDesc(t.description)}-${t.totalInstallments}`;
      const existing = latestInstallments.get(key);
      if (!existing || t.date > existing.date) {
        latestInstallments.set(key, t);
      }
    }

    for (const t of latestInstallments.values()) {
      const existsInCurrentMonth = transactions.some(
        curr => normalizeDesc(curr.description) === normalizeDesc(t.description) && curr.totalInstallments === t.totalInstallments
      );

      const isCreditCard = t.account?.type === 'CREDIT';
      
      if (!existsInCurrentMonth) {
        const diffMonths = (year - t.date.getFullYear()) * 12 + (month - (t.date.getMonth() + 1));
        
        if (diffMonths > 0) {
          const projectedInstallmentNumber = t.installmentNumber + diffMonths;
          
          if (projectedInstallmentNumber <= t.totalInstallments) {
            const projDate = new Date(year, month - 1, t.date.getDate());
            projections.push({
              ...t,
              id: `proj_api_${t.id}_${month}`,
              installmentNumber: projectedInstallmentNumber,
              projectedDate: projDate,
              isProjected: true,
              isCreditCard,
              title: getCleanTitle(t.description)
            } as any);
          }
        }
      }
    }

    return NextResponse.json({
      transactions: transactions.map(t => ({ 
        ...t, 
        isCreditCard: t.account?.type === 'CREDIT',
        isIgnored: t.category ? ignoredNames.includes(t.category) : false
      })),
      projections: projections.map((p: any) => ({ 
        ...p, 
        isCreditCard: p.isCreditCard ?? (p.creditCardId != null || p.account?.type === 'CREDIT'),
        isIgnored: p.category?.name ? ignoredNames.includes(p.category.name) : false
      }))
    });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}
