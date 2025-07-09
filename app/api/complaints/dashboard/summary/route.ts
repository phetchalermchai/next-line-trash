import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { prisma } from "@/lib/prisma";
import { formatThaiDatetime } from "@/utils/date";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  const total = await prisma.complaint.count();
  const done = await prisma.complaint.count({ where: { status: "DONE" } });
  const pending = await prisma.complaint.count({ where: { status: "PENDING" } });

  const latest = await prisma.complaint.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });


  return NextResponse.json({
    total,
    done,
    pending,
    latestUpdatedAt: latest?.updatedAt ? formatThaiDatetime(latest.updatedAt) : null,
  });
}