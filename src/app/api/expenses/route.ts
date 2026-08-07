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

    return NextResponse.json({ expenses });
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
