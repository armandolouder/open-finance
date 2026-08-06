export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';
import { applyCategoriesToTransactions } from '@/lib/categorization';
import { createHash } from 'crypto';

// ============================================================
// NORMALIZAÇÃO
// ============================================================
function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9 ]/g, ' ')    // remove especiais
    .replace(/\s+/g, ' ')
    .trim();
}

function generateHash(date: string, normDesc: string, amount: number, type: string): string {
  const raw = `${date}|${normDesc}|${Math.abs(amount).toFixed(2)}|${type}`;
  return createHash('sha256').update(raw).digest('hex');
}

// ============================================================
// PARSE CSV NUBANK
// Formato: date (YYYY-MM-DD), title, amount
// Positivo = compra, Negativo = estorno/pagamento
// ============================================================
interface CsvTx {
  date: string;
  description: string;
  normDescription: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  hash: string;
}

interface DbTx {
  date: Date;
  amount: number;
  description: string;
  normDescription: string;
  externalId: string | null;
}

function parseNubankCSV(text: string): CsvTx[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const startIdx = header.includes('date') || header.includes('data') ? 1 : 0;
  const results: CsvTx[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 3) continue;

    const date = cols[0].trim().replace(/"/g, '');
    const description = cols[1].trim().replace(/"/g, '');
    const rawAmount = cols[2].trim().replace(/"/g, '').replace(',', '.');
    const amount = parseFloat(rawAmount);

    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/) || isNaN(amount)) continue;

    // Ignorar pagamentos (valores muito negativos)
    if (amount < -500) continue;

    const normDesc = normalizeDescription(description);
    const type: 'DEBIT' | 'CREDIT' = amount < 0 ? 'CREDIT' : 'DEBIT';
    const hash = generateHash(date, normDesc, amount, type);

    results.push({ date, description, normDescription: normDesc, amount, type, hash });
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

// ============================================================
// RECONCILIAÇÃO — Matching Bipartito
// Garante que cada transação do DB só "absorve" UMA do CSV.
// Sem isso, múltiplos CSVs com o mesmo valor podem all match
// contra a mesma transação do DB → falso "já existe".
// ============================================================
function reconcile(csvTxns: CsvTx[], dbTxns: DbTx[]): {
  matched: CsvTx[];
  missing: CsvTx[];
} {
  const usedDb = new Set<number>(); // índices do DB já consumidos

  const matched: CsvTx[] = [];
  const missing: CsvTx[] = [];

  for (const csvTx of csvTxns) {
    const csvDate = new Date(csvTx.date + 'T12:00:00').getTime();
    const csvAmt = Math.abs(csvTx.amount);

    let foundIdx = -1;

    for (let i = 0; i < dbTxns.length; i++) {
      if (usedDb.has(i)) continue; // já consumida por outro CSV

      const db = dbTxns[i];
      const dbDate = new Date(db.date).getTime();
      const daysDiff = Math.abs((csvDate - dbDate) / (1000 * 60 * 60 * 24));

      // Tolerância de ±2 dias (shift Nubank→Pluggy)
      if (daysDiff > 2) continue;

      const dbAmt = Math.abs(db.amount);
      if (Math.abs(csvAmt - dbAmt) > 0.02) continue;

      // Match encontrado!
      foundIdx = i;
      break;
    }

    if (foundIdx >= 0) {
      usedDb.add(foundIdx);
      matched.push(csvTx);
    } else {
      missing.push(csvTx);
    }
  }

  return { matched, missing };
}

// ============================================================
// HANDLER
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountExternalId } = await params;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const csvText = await file.text();
    const csvTxns = parseNubankCSV(csvText);

    if (csvTxns.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma transação encontrada no CSV. Verifique o formato.' },
        { status: 400 }
      );
    }

    // Janela de datas baseada no CSV (±5 dias de margem)
    const csvDates = csvTxns.map(t => new Date(t.date + 'T12:00:00').getTime());
    const csvMinDate = new Date(Math.min(...csvDates));
    const csvMaxDate = new Date(Math.max(...csvDates));
    csvMinDate.setDate(csvMinDate.getDate() - 5);
    csvMaxDate.setDate(csvMaxDate.getDate() + 5);

    // Buscar conta
    const account = await prisma.account.findUnique({
      where: { externalId: accountExternalId },
      include: {
        transactions: {
          where: { date: { gte: csvMinDate, lte: csvMaxDate } },
          select: { date: true, amount: true, description: true, externalId: true },
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Normalizar transações do DB para comparação
    const dbTxns: DbTx[] = account.transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      description: t.description,
      normDescription: normalizeDescription(t.description),
      externalId: t.externalId,
    }));

    // ✅ Reconciliação com matching bipartito
    const { matched, missing } = reconcile(csvTxns, dbTxns);

    // Totais para o relatório
    const csvTotal = csvTxns.reduce((s, t) => t.amount > 0 ? s + t.amount : s, 0);
    const dbTotal = dbTxns.reduce((s, t) => t.amount > 0 ? s + t.amount : s, 0);
    const missingTotal = missing.reduce((s, t) => t.amount > 0 ? s + Math.abs(t.amount) : s, 0);

    const dryRun = formData.get('dryRun') === 'true';

    if (dryRun) {
      return NextResponse.json({
        preview: true,
        // Contagens
        csvCount: csvTxns.length,
        dbCount: dbTxns.length,
        matchedCount: matched.length,
        missingCount: missing.length,
        // Totais
        csvTotal: Math.round(csvTotal * 100) / 100,
        dbTotal: Math.round(dbTotal * 100) / 100,
        divergence: Math.round((csvTotal - dbTotal) * 100) / 100,
        missingTotal: Math.round(missingTotal * 100) / 100,
        // Transações ausentes
        missingTransactions: missing.map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          hash: t.hash,
        })),
      });
    }

    // Importar somente as ausentes
    let importedCount = 0;
    const withCategories = await applyCategoriesToTransactions(
      missing.map(tx => ({
        id: tx.hash,
        date: tx.date,
        description: tx.description,
        amount: Math.abs(tx.amount),
        type: tx.type,
        category: null,
        originalCategory: null,
      }))
    );

    for (const tx of withCategories) {
      const csvExternalId = `csv_${accountExternalId}_${tx.date}_${tx.id}`.slice(0, 100);

      await prisma.transaction.upsert({
        where: { externalId: csvExternalId },
        update: {},
        create: {
          externalId: csvExternalId,
          accountId: account.id,
          date: new Date(tx.date + 'T12:00:00'),
          description: tx.description,
          amount: Math.abs(tx.amount),
          direction: tx.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
          category: tx.category || null,
          originalCategory: tx.originalCategory || tx.category || null,
          isManual: true,
          notes: 'Importado via CSV Nubank',
        },
      });
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      csvCount: csvTxns.length,
      imported: importedCount,
      skipped: matched.length,
      csvTotal: Math.round(csvTotal * 100) / 100,
      divergence: Math.round((csvTotal - dbTotal) * 100) / 100,
      message: `${importedCount} lançamentos importados, ${matched.length} já existiam.`,
    });

  } catch (error: any) {
    console.error('Erro ao importar CSV:', error.stack || error.message);
    return NextResponse.json(
      { error: 'Falha ao processar CSV', details: error.message },
      { status: 500 }
    );
  }
}
