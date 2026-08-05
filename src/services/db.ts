import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (url) {
    const adapter = new PrismaPg({
      connectionString: url,
      ssl: {
        rejectUnauthorized: false
      }
    });

    return new PrismaClient({ adapter });
  }

  // Se a URL não existir, tenta criar o client (pode falhar no v7 sem adapter, mas é um fallback extremo)
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
