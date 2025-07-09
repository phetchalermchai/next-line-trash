import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { NextRequest, NextResponse } from "next/server";
import { ComplaintSource } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

const { searchParams } = new URL(req.url);
  const sourceParam = searchParams.get('source');
  const source = sourceParam && sourceParam !== 'ALL' ? (sourceParam as ComplaintSource) : undefined;

  const where = source ? { source } : {};

  const data = await prisma.complaint.groupBy({
    by: ['status'],
    where,
    _count: { status: true },
  });

  const formatted = data.map(d => ({
    status: d.status,
    count: d._count.status ?? 0,
  }));

  return NextResponse.json(formatted);
}