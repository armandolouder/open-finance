export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';
import { applyCategoriesToTransactions } from '@/lib/categorization';

export async function GET() {
  const cats = await prisma.category.findMany();
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: 'account_label_' } }
  });

  return NextResponse.json({
    categories: cats.map(c => c.name),
    settings: settings.map(s => ({ key: s.key, value: s.value }))
  });
}
