// file: app/api/users/[id]/accounts/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const accounts = await prisma.account.findMany({
    where: { userId: id },
    select: { id: true, provider: true },
  });

  return NextResponse.json(accounts);
}
