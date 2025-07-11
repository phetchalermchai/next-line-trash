import { PrismaClient } from '@prisma/client';

declare global {
  // ป้องกันการสร้างหลาย client ตอน dev ที่มี hot-reload
  // เพิ่มเฉพาะ dev เท่านั้น
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
