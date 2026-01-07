import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma Clientのインスタンスを作成（開発環境ではグローバルに保存）
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

// 開発環境では、addressBookが存在しない場合は新しいインスタンスを作成
let prismaInstance: PrismaClient;
if (process.env.NODE_ENV === 'production') {
  prismaInstance = globalForPrisma.prisma || createPrismaClient();
  globalForPrisma.prisma = prismaInstance;
} else {
  // 開発環境: 既存のインスタンスをチェックし、addressBookが存在しない場合は再作成
  if (globalForPrisma.prisma && 'addressBook' in globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
  } else {
    // 古いインスタンスを破棄して新しいインスタンスを作成
    if (globalForPrisma.prisma) {
      globalForPrisma.prisma.$disconnect().catch(() => {});
    }
    prismaInstance = createPrismaClient();
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;