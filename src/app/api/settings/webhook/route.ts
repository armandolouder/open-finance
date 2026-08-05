import { NextResponse } from 'next/server';
import { prisma } from '@/services/db';

export async function GET() {
  try {
    const webhookSetting = await prisma.setting.findUnique({
      where: { key: 'PLUGGY_WEBHOOK_URL' }
    });

    return NextResponse.json({
      webhookUrl: webhookSetting?.value || ''
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { webhookUrl } = await req.json();

    if (webhookUrl !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'PLUGGY_WEBHOOK_URL' },
        update: { value: webhookUrl },
        create: { key: 'PLUGGY_WEBHOOK_URL', value: webhookUrl }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
