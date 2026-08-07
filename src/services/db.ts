import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://'))) {
    let finalUrl = url;
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('sslmode', 'no-verify');
      parsedUrl.searchParams.set('sslaccept', 'accept_invalid_certs');
      finalUrl = parsedUrl.toString();
    } catch(e) {}

    const adapter = new PrismaPg({
      connectionString: finalUrl,
      ssl: { rejectUnauthorized: false }
    });

    return new PrismaClient({ adapter });
  }

  // Fallback para SQLite local (só roda na máquina do dev, nunca na Vercel)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const adapter = new PrismaBetterSqlite3({ url: 'dev.db' });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
