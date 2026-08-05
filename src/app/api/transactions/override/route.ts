import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function POST(request: NextRequest) {
  try {
    const { externalId, categoryId } = await request.json();
    
    if (!externalId || !categoryId) {
      return NextResponse.json({ error: 'externalId and categoryId are required' }, { status: 400 });
    }

    const override = await prisma.transactionOverride.upsert({
      where: { externalId },
      update: { categoryId },
      create: { externalId, categoryId }
    });

    return NextResponse.json(override);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
