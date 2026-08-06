import { NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function GET(req: Request) {
  try {
    const expenses = await prisma.recurringExpense.findMany({
      include: { category: true, account: true, creditCard: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses/recurring error:", error);
    return NextResponse.json({ error: "Failed to fetch recurring expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.title || data.amount === undefined || !data.type || !data.frequency || !data.startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expense = await prisma.recurringExpense.create({
      data: {
        title: data.title,
        description: data.description,
        amount: parseFloat(data.amount),
        type: data.type,
        frequency: data.frequency, // MONTHLY, YEARLY, INSTALLMENT
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth) : new Date(data.startDate).getDate(),
        accountId: data.accountId || null,
        creditCardId: data.creditCardId || null,
        categoryId: data.categoryId || null,
        totalInstallments: data.totalInstallments ? parseInt(data.totalInstallments) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
      },
      include: { category: true, account: true, creditCard: true }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses/recurring error:", error);
    return NextResponse.json({ error: "Failed to create recurring expense" }, { status: 500 });
  }
}
