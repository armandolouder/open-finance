import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Achar a conciliação
    const reconciliation = await prisma.reconciliation.findUnique({
      where: { id }
    });

    if (!reconciliation) {
      return NextResponse.json({ error: "Conciliação não encontrada" }, { status: 404 });
    }

    // Excluir a conciliação
    await prisma.reconciliation.delete({
      where: { id }
    });

    // Se a transação não tiver outras conciliações, desmarcar como conciliada
    const remainingReconciliations = await prisma.reconciliation.count({
      where: { transactionId: reconciliation.transactionId }
    });

    if (remainingReconciliations === 0) {
      await prisma.transaction.update({
        where: { id: reconciliation.transactionId },
        data: { isReconciled: false }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting reconciliation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
