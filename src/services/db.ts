import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  let url = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (url) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('sslmode', 'no-verify');
      parsedUrl.searchParams.set('sslaccept', 'accept_invalid_certs');
      const finalUrl = parsedUrl.toString();
      
      const opts: any = { datasourceUrl: finalUrl };
      return new PrismaClient(opts);
    } catch(e) {
      // Ignore URL parsing errors
    }
  }

  return new PrismaClient(); // fallback
}

// Força a recriação do client (útil após alterações de schema no dev)
if (process.env.NODE_ENV !== 'production') {
  delete globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
