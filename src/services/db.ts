import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Force reload after schema changes

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return new PrismaClient(); // fallback if not set yet, or throws at runtime
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Força a recriação do client (útil após alterações de schema no dev)
if (process.env.NODE_ENV !== 'production') {
  delete globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
