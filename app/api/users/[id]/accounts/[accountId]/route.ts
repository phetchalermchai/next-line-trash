// file: app/api/users/[Id]/accounts/[accountId]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(_: Request, { params }: { params: { userId: string; accountId: string } }) {
  await prisma.account.delete({ where: { id: params.accountId } });

  const remaining = await prisma.account.count({ where: { userId: params.userId } });
  if (remaining === 0) {
    await prisma.user.delete({ where: { id: params.userId } });
  }

  return NextResponse.json({ message: "deleted" });
}