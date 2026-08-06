export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPluggyClient } from '@/services/pluggy/client';
import { prisma } from '@/services/db';
import { applyCategoriesToTransactions } from '@/lib/categorization';

export async function POST() {
  try {
    const pluggyClient = await getPluggyClient();
    const connections = await prisma.connection.findMany();
    const itemIds = connections.map(c => c.externalItemId);
    
    if (itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum banco conectado encontrado. Por favor, conecte um banco primeiro.' },
        { status: 400 }
      );
    }

    const results = [];

    for (const itemId of itemIds) {
      try {
        let item;
        try {
          item = await pluggyClient.updateItem(itemId);
        } catch (updateErr: any) {
          console.warn(`Não foi possível forçar a atualização do item ${itemId} (possivelmente é do Sandbox): ${updateErr.message}. Tentando apenas buscar os dados...`);
          item = await pluggyClient.fetchItem(itemId);
        }
        
        // Upsert Connection
        const connection = await prisma.connection.upsert({
          where: { externalItemId: item.id },
          update: {
            status: item.status,
            lastSyncAt: new Date(),
          },
          create: {
            externalItemId: item.id,
            status: item.status,
            institutionName: item.connector?.name || 'Desconhecida',
            lastSyncAt: new Date(),
          }
        });

        const accounts = await pluggyClient.fetchAccounts(itemId);
        let totalTxnsSaved = 0;

        for (const acc of accounts) {
          // Upsert Account
          const dbAccount = await prisma.account.upsert({
            where: { externalId: acc.id },
            update: {
              balance: acc.balance ?? 0,
              availableBalance: acc.balance ?? 0,
            },
            create: {
              externalId: acc.id,
              connectionId: connection.id,
              name: acc.name,
              type: acc.type,
              subtype: acc.subtype,
              currency: acc.currencyCode,
              balance: acc.balance ?? 0,
              availableBalance: acc.balance ?? 0,
            }
          });

          // Handle Credit Card metadata if applicable
          if (acc.type === 'CREDIT') {
            await prisma.creditCard.upsert({
              where: { externalId: acc.id },
              update: {
                creditLimit: acc.creditData?.creditLimit ?? null,
                availableLimit: acc.creditData?.availableCreditLimit ?? null,
                lastSyncAt: new Date(),
              },
              create: {
                externalId: acc.id,
                accountId: dbAccount.id,
                name: acc.name,
                institutionName: connection.institutionName,
                creditLimit: acc.creditData?.creditLimit ?? null,
                availableLimit: acc.creditData?.availableCreditLimit ?? null,
                lastSyncAt: new Date(),
              }
            });
          }

          // Fetch transactions
          const { transactions } = await pluggyClient.fetchTransactions(acc.id);
          
          // Apply categories
          const processedTransactions = await applyCategoriesToTransactions(transactions, acc.name);

          // Upsert transactions
          for (const tx of processedTransactions) {
            await prisma.transaction.upsert({
              where: { externalId: tx.id },
              update: {
                date: new Date(tx.date),
                description: tx.description,
                amount: tx.amount,
                direction: tx.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
                category: tx.category,
                originalCategory: tx.originalCategory || tx.category,
                
                billForecastDate: tx.creditCardMetadata?.billForecastDate ?? null,
                purchaseDate: tx.creditCardMetadata?.purchaseDate ? new Date(tx.creditCardMetadata.purchaseDate) : null,
                totalInstallments: tx.creditCardMetadata?.totalInstallments ?? null,
                installmentNumber: tx.creditCardMetadata?.installmentNumber ?? null,
                cardNumber: tx.creditCardMetadata?.cardNumber ?? null,
                pluggyUpdatedAt: new Date(),
              },
              create: {
                externalId: tx.id,
                accountId: dbAccount.id,
                date: new Date(tx.date),
                description: tx.description,
                amount: tx.amount,
                direction: tx.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
                category: tx.category,
                originalCategory: tx.originalCategory || tx.category,
                
                billForecastDate: tx.creditCardMetadata?.billForecastDate ?? null,
                purchaseDate: tx.creditCardMetadata?.purchaseDate ? new Date(tx.creditCardMetadata.purchaseDate) : null,
                totalInstallments: tx.creditCardMetadata?.totalInstallments ?? null,
                installmentNumber: tx.creditCardMetadata?.installmentNumber ?? null,
                cardNumber: tx.creditCardMetadata?.cardNumber ?? null,
                pluggyUpdatedAt: new Date(),
              }
            });
          }
          totalTxnsSaved += transactions.length;
        }

        results.push({
          itemId: item.id,
          status: item.status,
          institution: item.connector?.name,
          accountsSynced: accounts.length,
          transactionsSaved: totalTxnsSaved
        });

      } catch (itemError: any) {
        console.error(`Erro ao buscar item ${itemId}:`, itemError.stack || itemError.message);
        results.push({
          itemId,
          status: 'ERROR',
          error: itemError.message
        });
      }
    }

    return NextResponse.json({
      message: 'Sincronização concluída com sucesso',
      items: results
    });

  } catch (error: any) {
    console.error('Erro geral na API de sincronização:', error.message);
    return NextResponse.json(
      { error: 'Falha ao se comunicar com a Pluggy', details: error.message },
      { status: 500 }
    );
  }
}
