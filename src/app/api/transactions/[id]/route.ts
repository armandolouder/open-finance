import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        categoryId: body.categoryId || null,
        subcategoryId: body.subcategoryId || null,
        tags: body.tags || null,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error: any) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
