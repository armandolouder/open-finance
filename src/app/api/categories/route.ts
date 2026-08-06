import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { 
        rules: true,
        children: {
          include: { rules: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, color, rules, parentId, showOnHome, ignoreInTotals } = await request.json();
    
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        color,
        parentId: parentId || null,
        showOnHome: showOnHome ?? true,
        ignoreInTotals: ignoreInTotals ?? false,
        rules: {
          create: (rules || []).map((pattern: string) => ({ pattern }))
        }
      },
      include: { rules: true, children: { include: { rules: true } } }
    });

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
