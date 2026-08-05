import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';
import { getPluggyClient } from '@/services/pluggy/client';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    if (!itemId) {
      return NextResponse.json({ error: 'ID da conexão não fornecido' }, { status: 400 });
    }

    // Tentar remover do Pluggy primeiro
    try {
      const pluggyClient = await getPluggyClient();
      await pluggyClient.deleteItem(itemId);
    } catch (e: any) {
      console.warn("Aviso: Falha ao deletar item no Pluggy (pode já ter sido removido).", e?.message);
    }

    // O Prisma tem onDelete: Cascade nas relações, então apagar o Connection vai apagar:
    // Account, Transaction, CreditCard, CreditCardBill, Investment que estiverem associados.
    await prisma.connection.deleteMany({
      where: { externalItemId: itemId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir conexão:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
