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
      
      // Prisma 7 strict constructor validation rejects `datasources` and `datasourceUrl`.
      // The only way to override the URL dynamically is to mutate process.env.
      process.env.POSTGRES_URL_NON_POOLING = finalUrl;
      process.env.POSTGRES_PRISMA_URL = finalUrl;
      process.env.DATABASE_URL = finalUrl;
      process.env.POSTGRES_URL = finalUrl;
    } catch(e) {
      // Ignore URL parsing errors
    }
  }

  return new PrismaClient();
}

// Força a recriação do client (útil após alterações de schema no dev)
if (process.env.NODE_ENV !== 'production') {
  delete globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
