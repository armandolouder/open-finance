const PLUGGY_API_URL = 'https://api.pluggy.ai';

export class CustomPluggyClient {
  private apiKey: string | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey;

    const response = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: this.clientId, clientSecret: this.clientSecret })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Falha na autenticação: ${response.statusText}`);
    }

    const data = await response.json();
    this.apiKey = data.apiKey;
    return this.apiKey!;
  }

  private async get(path: string) {
    const key = await this.getApiKey();
    const res = await fetch(`${PLUGGY_API_URL}${path}`, {
      headers: { 'X-API-KEY': key }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erro ${res.status}: ${path}`);
    }
    return res.json();
  }

  async fetchItem(itemId: string) {
    return this.get(`/items/${itemId}`);
  }

  async updateItem(itemId: string) {
    const key = await this.getApiKey();
    const res = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erro ${res.status} ao atualizar item`);
    }
    return res.json();
  }

  async deleteItem(itemId: string) {
    const key = await this.getApiKey();
    const res = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'X-API-KEY': key }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erro ${res.status} ao deletar item`);
    }
    return res.text().then(text => text ? JSON.parse(text) : {});
  }

  async fetchAccounts(itemId: string) {
    const data = await this.get(`/accounts?itemId=${itemId}`);
    return data.results ?? [];
  }

  async fetchTransactions(accountId: string, limit = 500) {
    let allTransactions: any[] = [];
    let cursor: string | null = null;
    
    do {
      const params = new URLSearchParams({ accountId });
      if (cursor) params.set('after', cursor);
      
      const data = await this.get(`/v2/transactions?${params.toString()}`);
      const results = data.results ?? [];
      
      allTransactions = allTransactions.concat(results);
      cursor = data.next ?? null;
      
      // Se não houver mais páginas ou atingirmos o limite, paramos
    } while (cursor && allTransactions.length < limit);
    
    // Garantir que não retornamos mais do que o limite pedido (opcional)
    if (allTransactions.length > limit) {
      allTransactions = allTransactions.slice(0, limit);
    }
    
    return {
      transactions: allTransactions,
      nextCursor: cursor,
    };
  }

  async fetchInvestments(itemId: string) {
    const data = await this.get(`/investments?itemId=${itemId}`);
    return data.results ?? [];
  }

  async fetchIdentity(itemId: string) {
    const data = await this.get(`/identity?itemId=${itemId}`);
    return data;
  }
}

import { prisma } from '@/services/db';

export const getPluggyClient = async () => {
  let clientId = process.env.PLUGGY_CLIENT_ID;
  let clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['PLUGGY_CLIENT_ID', 'PLUGGY_CLIENT_SECRET'] } }
    });
    
    for (const s of settings) {
      if (s.key === 'PLUGGY_CLIENT_ID') clientId = s.value;
      if (s.key === 'PLUGGY_CLIENT_SECRET') clientSecret = s.value;
    }
  }

  return new CustomPluggyClient(clientId || '', clientSecret || '');
};
