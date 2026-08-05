export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { syncItemData } from '@/services/sync';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('Recebido Webhook da Pluggy:', body);

    const { event, itemId } = body;

    if (!event || !itemId) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // Eventos que indicam que podemos baixar/atualizar os dados
    if (event === 'item/updated' || event === 'item/created' || event === 'item/login_succeeded') {
      
      // Iniciamos a sincronização.
      // Em um ambiente de produção real com Vercel Functions (limite de 10-60s), 
      // dependendo do número de transações, isso pode dar timeout.
      // Como estamos construindo para testes e volume baixo no início, rodar sincronamente é aceitável.
      // Alternativamente, poderíamos usar um sistema de filas, mas vamos manter simples.
      
      try {
        await syncItemData(itemId);
      } catch (syncError) {
        console.error(`Falha ao sincronizar o item ${itemId} via Webhook:`, syncError);
        // Mesmo falhando internamente, retornamos 200 para a Pluggy não ficar re-enviando 
        // infinitamente (a menos que a gente queira o re-try deles).
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no processamento do webhook:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
