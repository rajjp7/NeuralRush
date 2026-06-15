import { PrismaClient } from '@prisma/client';

declare global {
  var prismaInstance: PrismaClient | undefined;
}

export const db = global.prismaInstance || new PrismaClient({
  log: ['warn', 'error'], 
});

if (process.env.NODE_ENV !== 'production') {
  global.prismaInstance = db;
}