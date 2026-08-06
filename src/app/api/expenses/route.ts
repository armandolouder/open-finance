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

    // We can project recurring expenses for the current month
    const projections = recurringExpenses.map(re => {
      // Logic to determine if this recurrence happens in the requested month
      // For MONTHLY, it generally does if startDate <= endDate
      // Here we just attach a projected date for this month
      const projDate = new Date(year, month - 1, re.dayOfMonth || 1);
      return {
        ...re,
        projectedDate: projDate,
        isProjected: true,
        title: re.title
      };
    });

    // Automatically project future installments from Pluggy API
    const pastInstallments = await prisma.transaction.findMany({
      where: {
        date: { lt: startDate },
        direction: 'DEBIT',
        totalInstallments: { gt: 1 },
        installmentNumber: { not: null }
      }
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
              title: getCleanTitle(t.description)
            } as any);
          }
        }
      }
    }

    return NextResponse.json({
      transactions,
      projections
    });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}
