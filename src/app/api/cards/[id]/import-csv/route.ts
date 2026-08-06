export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';
import { applyCategoriesToTransactions } from '@/lib/categorization';

// Nubank CSV format: date (YYYY-MM-DD), title, amount
// Positive = purchase, Negative = refund/payment

function parseNubankCSV(text: string): { date: string; description: string; amount: number }[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Skip header row
  const header = lines[0].toLowerCase();
  const startIdx = header.includes('date') || header.includes('data') ? 1 : 0;

  const results: { date: string; description: string; amount: number }[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    // Handle CSV with potential commas inside quoted fields
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 3) continue;

    const date = cols[0].trim().replace(/"/g, '');
    const description = cols[1].trim().replace(/"/g, '');
    const rawAmount = cols[2].trim().replace(/"/g, '').replace(',', '.');
    const amount = parseFloat(rawAmount);

    if (!date || isNaN(amount)) continue;
    // Skip payments (very large negative values)
    if (amount < -500) continue;

    results.push({ date, description, amount });
  }

  return results;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function isSameTransaction(
  csvTx: { date: string; description: string; amount: number },
  dbTx: { date: Date; amount: number }
): boolean {
  const csvDate = new Date(csvTx.date + 'T12:00:00');
  const dbDate = new Date(dbTx.date);

  // Tolerância de ±2 dias (Pluggy às vezes registra com 1 dia de diferença)
  const daysDiff = Math.abs((csvDate.getTime() - dbDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 2) return false;

  // Valores devem ser idênticos (positivo = compra)
  const csvAmt = Math.abs(csvTx.amount);
  const dbAmt = Math.abs(dbTx.amount);

  return Math.abs(csvAmt - dbAmt) < 0.02; // tolerância de 2 centavos
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountExternalId } = await params;

    // Buscar o account no banco
    const account = await prisma.account.findUnique({
      where: { externalId: accountExternalId },
      include: {
        transactions: {
          select: { date: true, amount: true, description: true, externalId: true },
          orderBy: { date: 'desc' },
          take: 500,
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Ler o CSV do body (multipart/form-data)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const csvText = await file.text();
    const csvTransactions = parseNubankCSV(csvText);

    if (csvTransactions.length === 0) {
      return NextResponse.json({ error: 'Nenhuma transação encontrada no CSV. Verifique o formato.' }, { status: 400 });
    }

    const existingTxns = account.transactions;

    // Separar novas das duplicatas
    const newTransactions: typeof csvTransactions = [];
    const duplicates: typeof csvTransactions = [];

    for (const csvTx of csvTransactions) {
      // Ignorar pagamentos (valor negativo) e estornos negativos do CSV
      const isDuplicate = existingTxns.some(dbTx => isSameTransaction(csvTx, dbTx));
      if (isDuplicate) {
        duplicates.push(csvTx);
      } else {
        newTransactions.push(csvTx);
      }
    }

    const dryRun = formData.get('dryRun') === 'true';

    if (dryRun) {
      // Apenas preview, não importa nada
      return NextResponse.json({
        preview: true,
        csvTotal: csvTransactions.length,
        newCount: newTransactions.length,
        duplicateCount: duplicates.length,
        newTransactions: newTransactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
        })),
      });
    }

    // Importar transações novas
    const toImport = newTransactions.map(tx => ({
      date: tx.date,
      description: tx.description,
      amount: Math.abs(tx.amount), // sempre positivo no banco
      category: undefined as string | undefined,
    }));

    // Aplicar categorização
    const withCategories = await applyCategoriesToTransactions(
      toImport.map(tx => ({
        id: `csv_import_${tx.date}_${tx.amount}`,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: 'DEBIT',
        category: null,
        originalCategory: null,
      }))
    );

    let importedCount = 0;
    for (const tx of withCategories) {
      // Gerar externalId único para imports CSV
      const csvExternalId = `csv_${accountExternalId}_${tx.date}_${Math.round(tx.amount * 100)}`;

      await prisma.transaction.upsert({
        where: { externalId: csvExternalId },
        update: {}, // Não atualizar se já existir
        create: {
          externalId: csvExternalId,
          accountId: account.id,
          date: new Date(tx.date + 'T12:00:00'),
          description: tx.description,
          amount: tx.amount,
          direction: tx.amount < 0 ? 'CREDIT' : 'DEBIT',
          category: tx.category || null,
          originalCategory: tx.originalCategory || tx.category || null,
          isManual: true, // marcado como importado manualmente via CSV
        },
      });
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      csvTotal: csvTransactions.length,
      imported: importedCount,
      duplicatesSkipped: duplicates.length,
      message: `${importedCount} lançamentos importados, ${duplicates.length} já existiam.`,
    });

  } catch (error: any) {
    console.error('Erro ao importar CSV:', error.message);
    return NextResponse.json(
      { error: 'Falha ao processar CSV', details: error.message },
      { status: 500 }
    );
  }
}
