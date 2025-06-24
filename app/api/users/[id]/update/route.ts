// file: app/api/users/[id]/update/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { role, status } = await req.json();

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(role && { role }),
      ...(status && { status }),
    },
  });

  return NextResponse.json(updated);
}
