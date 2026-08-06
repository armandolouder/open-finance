import { prisma } from '@/services/db';
import { getPluggyClient } from '@/services/pluggy/client';

export async function syncItemData(itemId: string) {
  try {
    const client = await getPluggyClient();

    // 1. Fetch Item details
    const item = await client.fetchItem(itemId);

    // 2. Upsert Connection (Item)
    const connection = await prisma.connection.upsert({
      where: { externalItemId: itemId },
      update: {
        status: item.status,
        institutionName: item.connector?.name || 'Desconhecida',
        lastSyncAt: new Date(),
      },
      create: {
        externalItemId: itemId,
        status: item.status,
        institutionName: item.connector?.name || 'Desconhecida',
        lastSyncAt: new Date(),
      }
    });

    // Se o item não estiver com status de sucesso/atualizado, podemos parar por aqui ou continuar se houver dados parciais.
    // Vamos continuar para garantir que atualizamos o saldo das contas mesmo que tenha tido um erro parcial.

    // 3. Fetch Accounts
    const accounts = await client.fetchAccounts(itemId);

    for (const acc of accounts) {
      // 4. Upsert Account
      const account = await prisma.account.upsert({
        where: { externalId: acc.id },
        update: {
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          balance: acc.balance,
          currency: acc.currencyCode || 'BRL',
          lastSyncAt: new Date(),
        },
        create: {
          externalId: acc.id,
          connectionId: connection.id,
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          balance: acc.balance,
          currency: acc.currencyCode || 'BRL',
          lastSyncAt: new Date(),
        }
      });

      // 5. Fetch Transactions for this Account
      // Vamos buscar o limite padrão, ou podemos implementar lógica de paginação completa
      const { transactions } = await client.fetchTransactions(acc.id);

      for (const tx of transactions) {
        // Pluggy v2 API mapping
        // date no v2 geralmente é datetime ou date
        const txDate = tx.date ? new Date(tx.date) : new Date();
        const txAmount = tx.amount;
        
        // Verifica se já existe uma transação manual (importada via CSV) com o mesmo valor (tolerância de R$ 0.02)
        // e data próxima (tolerância de 3 dias) que ainda não foi vinculada à Pluggy.
        // Se encontrar, atualiza a transação manual com o ID da Pluggy em vez de criar duplicata.
        const existingManualMatch = await prisma.transaction.findFirst({
          where: {
            accountId: account.id,
            isManual: true,
            externalId: { startsWith: 'csv_' },
            amount: { gte: txAmount - 0.02, lte: txAmount + 0.02 },
            date: {
              gte: new Date(txDate.getTime() - 3 * 24 * 60 * 60 * 1000),
              lte: new Date(txDate.getTime() + 3 * 24 * 60 * 60 * 1000)
            }
          }
        });

        if (existingManualMatch) {
          // Atualiza a transação manual para usar o externalId da Pluggy.
          // Com isso, o upsert logo abaixo apenas atualizará esse registro, sem duplicar.
          await prisma.transaction.update({
            where: { id: existingManualMatch.id },
            data: {
              externalId: tx.id,
              // Mantém isManual como true para o usuário saber que foi recuperada do CSV originalmente
            }
          });
        }

        await prisma.transaction.upsert({
          where: { externalId: tx.id },
          update: {
            date: txDate,
            description: tx.description || tx.descriptionRaw || 'Transação',
            amount: tx.amount,
            direction: tx.amount < 0 ? 'DEBIT' : 'CREDIT',
            category: tx.category,
            status: tx.status,
            pluggyUpdatedAt: new Date(),
          },
          create: {
            externalId: tx.id,
            accountId: account.id,
            date: txDate,
            description: tx.description || tx.descriptionRaw || 'Transação',
            amount: tx.amount,
            direction: tx.amount < 0 ? 'DEBIT' : 'CREDIT',
            category: tx.category,
            status: tx.status,
            pluggyUpdatedAt: new Date(),
          }
        });
      }
    }

    // Opcionalmente podemos buscar investimentos e cartões de crédito aqui também,
    // mas vamos manter simples por enquanto.

    console.log(`Sync completado com sucesso para o item ${itemId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Erro ao sincronizar item ${itemId}:`, error);
    
    // Atualizar o status da conexão para ERROR
    await prisma.connection.updateMany({
      where: { externalItemId: itemId },
      data: { 
        status: 'ERROR',
        lastError: error.message 
      }
    });

    throw error;
  }
}
