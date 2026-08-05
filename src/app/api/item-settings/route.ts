import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'item_name_' } }
    });
    const names: Record<string, string> = {};
    for (const s of settings) {
      names[s.key.replace('item_name_', '')] = s.value;
    }
    return NextResponse.json(names);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { itemId, name } = await request.json();
    if (!itemId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    
    await prisma.setting.upsert({
      where: { key: `item_name_${itemId}` },
      update: { value: name },
      create: { key: `item_name_${itemId}`, value: name }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
