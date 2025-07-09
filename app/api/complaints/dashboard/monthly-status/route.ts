import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { NextRequest, NextResponse } from "next/server";
import { ComplaintStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);

  const data = await prisma.$queryRawUnsafe<{
    month: number;
    status: ComplaintStatus;
    count: number;
  }[]>(`
    SELECT 
      EXTRACT(MONTH FROM "createdAt")::int AS month,
      "status", 
      COUNT(*)::int as count
    FROM "Complaint"
    WHERE EXTRACT(YEAR FROM "createdAt") = ${year}
    GROUP BY month, "status"
    ORDER BY month ASC;
  `);

  return NextResponse.json(data);
}
