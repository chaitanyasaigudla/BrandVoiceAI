import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.LOG_LEVEL === 'debug'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Singleton pattern – reuse in development to avoid connection pool exhaustion
export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

let dbConnected = false;

export function isDbConnected(): boolean {
  return dbConnected;
}

export async function connectDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL || '';
  logger.info(`Connecting to database at ${url.replace(/:[^:@]+@/, ':***@')}`);

  try {
    // Test raw query first
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    logger.info('✅ Database connected successfully');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Database connection failed: ${msg}`);
    logger.warn('Server will start without database – some endpoints will not work');
    // Don't exit – let server start so frontend can load
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
