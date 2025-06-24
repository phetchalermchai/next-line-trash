// file: app/api/users/[id]/accounts/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const accounts = await prisma.account.findMany({
    where: { userId: params.id },
    select: { id: true, provider: true },
  });

  return NextResponse.json(accounts);
}
