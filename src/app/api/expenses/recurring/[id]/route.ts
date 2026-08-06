import { NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await req.json();
    const { id } = await params;

    const expense = await prisma.recurringExpense.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
        type: data.type,
        frequency: data.frequency,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : undefined),
        dayOfMonth: data.dayOfMonth ? parseInt(data.dayOfMonth) : undefined,
        accountId: data.accountId,
        creditCardId: data.creditCardId,
        categoryId: data.categoryId,
        status: data.status,
        totalInstallments: data.totalInstallments ? parseInt(data.totalInstallments) : undefined,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
      },
      include: { category: true, account: true, creditCard: true }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error(`PUT /api/expenses/recurring/[id] error:`, error);
    return NextResponse.json({ error: "Failed to update recurring expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.recurringExpense.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/expenses/recurring/[id] error:`, error);
    return NextResponse.json({ error: "Failed to delete recurring expense" }, { status: 500 });
  }
}
