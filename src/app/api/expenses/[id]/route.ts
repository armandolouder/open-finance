import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        series: true
      }
    });

    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("GET /api/expenses/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      title, description, amount, dueDate, competenceDate,
      categoryId, subcategoryId, tags, supplier, costCenter, project,
      paymentMethod, accountId, creditCardId, notes,
      updateMode // 'SINGLE', 'THIS_AND_FUTURE', 'ALL'
    } = body;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    const updateData = {
      title, description, amount, 
      dueDate: dueDate ? new Date(dueDate) : undefined,
      competenceDate: competenceDate ? new Date(competenceDate) : null,
      categoryId, subcategoryId, tags, supplier, costCenter, project,
      paymentMethod, accountId, creditCardId, notes
    };

    if (!expense.seriesId || updateMode === 'SINGLE' || !updateMode) {
      // Atualiza apenas esta despesa
      const updated = await prisma.expense.update({
        where: { id },
        data: updateData
      });
      return NextResponse.json(updated);
    }

    if (updateMode === 'THIS_AND_FUTURE') {
      // Atualiza esta e as próximas da mesma série
      const updated = await prisma.expense.updateMany({
        where: {
          seriesId: expense.seriesId,
          dueDate: { gte: expense.dueDate }
        },
        data: updateData
      });
      return NextResponse.json({ updatedCount: updated.count });
    }

    if (updateMode === 'ALL') {
      // Atualiza TODAS da mesma série
      const updated = await prisma.expense.updateMany({
        where: { seriesId: expense.seriesId },
        data: updateData
      });
      
      // Opcional: Atualizar os dados padrão da série também
      await prisma.expenseSeries.update({
        where: { id: expense.seriesId },
        data: {
          title, description, categoryId, subcategoryId, tags, 
          supplier, costCenter, project, paymentMethod, accountId, creditCardId
        }
      });
      
      return NextResponse.json({ updatedCount: updated.count });
    }

    return NextResponse.json({ error: "Invalid update mode" }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/expenses/[id] error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Suporte para exclusão baseada na query string ?mode=ALL etc.
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'SINGLE'; // 'SINGLE', 'THIS_AND_FUTURE', 'ALL'

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    if (!expense.seriesId || mode === 'SINGLE') {
      await prisma.expense.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (mode === 'THIS_AND_FUTURE') {
      const deleted = await prisma.expense.deleteMany({
        where: {
          seriesId: expense.seriesId,
          dueDate: { gte: expense.dueDate }
        }
      });
      return NextResponse.json({ deletedCount: deleted.count });
    }

    if (mode === 'ALL') {
      await prisma.expenseSeries.delete({
        where: { id: expense.seriesId }
      });
      // As despesas são excluídas via onDelete: Cascade
      return NextResponse.json({ success: true, deletedSeries: true });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("DELETE /api/expenses/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
