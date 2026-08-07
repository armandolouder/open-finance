import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function POST(req: NextRequest) {
  try {
    const { transactionId, expenseId, amount } = await req.json();

    if (!transactionId || !expenseId || amount === undefined) {
      return NextResponse.json({ error: "Campos obrigatórios faltando: transactionId, expenseId ou amount" }, { status: 400 });
    }

    // Cria a conciliação
    const reconciliation = await prisma.reconciliation.create({
      data: {
        transactionId,
        expenseId,
        amount: parseFloat(amount),
      }
    });

    // Atualiza a transação como conciliada
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { isReconciled: true }
    });

    return NextResponse.json({ success: true, reconciliation });
  } catch (error: any) {
    console.error("Error creating reconciliation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
