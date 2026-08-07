export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function GET() {
  const txs = await prisma.transaction.findMany({
    where: {
      totalInstallments: { gt: 1 }
    }
  });
  return NextResponse.json(txs);
}
