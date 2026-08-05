import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, type, color, rules, showOnHome } = await request.json();
    
    // Update basic info
    const dataToUpdate: any = { name, type, color };
    if (showOnHome !== undefined) dataToUpdate.showOnHome = showOnHome;

    const category = await prisma.category.update({
      where: { id },
      data: dataToUpdate
    });

    // Recreate rules if provided
    if (rules) {
      await prisma.transactionRule.deleteMany({ where: { categoryId: id } });
      if (rules.length > 0) {
        await prisma.transactionRule.createMany({
          data: rules.map((pattern: string) => ({ categoryId: id, pattern }))
        });
      }
    }

    const updated = await prisma.category.findUnique({
      where: { id },
      include: { rules: true }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // First, delete any subcategories to avoid foreign key constraint errors
    await prisma.category.deleteMany({ where: { parentId: id } });
    
    // Then delete the category itself
    await prisma.category.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
