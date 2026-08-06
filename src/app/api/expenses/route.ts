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
        direction: 'DEBIT'
      },
      include: { category: true, account: true }
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
        isProjected: true
      };
    });

    return NextResponse.json({
      transactions,
      projections
    });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}
