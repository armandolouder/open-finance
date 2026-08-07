export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { prisma } from "@/services/db";

export async function GET(req: Request) {
  const transactions = await prisma.transaction.findMany({
    where: { description: { contains: 'caixa', mode: 'insensitive' } }
  });
  
  const recurring = await prisma.recurringExpense.findMany({
    where: { title: { contains: 'Apartamento' } }
  });

  return NextResponse.json({ transactions, recurring });
}
