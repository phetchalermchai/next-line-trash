// file: app/api/users/[Id]/accounts/[accountId]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(_: Request, { params }: { params: Promise<{ userId: string; accountId: string }> }) {
  const { userId } = await params
  const { accountId } = await params
  await prisma.account.delete({ where: { id: accountId } });

  const remaining = await prisma.account.count({ where: { userId: userId } });
  if (remaining === 0) {
    await prisma.user.delete({ where: { id: userId } });
  }

  return NextResponse.json({ message: "deleted" });
}