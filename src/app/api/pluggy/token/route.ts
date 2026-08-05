export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PluggyClient } from 'pluggy-sdk';

export async function POST(req: Request) {
  try {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Faltam as credenciais da Pluggy' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const itemId = body?.itemId;

    const client = new PluggyClient({
      clientId,
      clientSecret,
    });

    const tokenData = await client.createConnectToken(itemId);

    return NextResponse.json({ accessToken: tokenData.accessToken });
  } catch (error: any) {
    console.error('Erro ao gerar token:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
