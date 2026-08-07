import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

    // Delete all reconciliations for this transaction
    await prisma.reconciliation.deleteMany({
      where: { transactionId }
    });

    // Mark the transaction as not reconciled
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { isReconciled: false }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting reconciliations for transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
