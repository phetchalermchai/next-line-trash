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
  const source = searchParams.get("source") || "ALL";
  const quarter = searchParams.get("quarter") || "ALL";

  let sourceCondition = "";
  if (source !== "ALL") {
    sourceCondition = `AND "source" = '${source}'`;
  }

  let quarterCondition = "";
  if (quarter !== "ALL") {
    if (quarter === "Q1") quarterCondition = "AND EXTRACT(MONTH FROM \"createdAt\") BETWEEN 1 AND 3";
    else if (quarter === "Q2") quarterCondition = "AND EXTRACT(MONTH FROM \"createdAt\") BETWEEN 4 AND 6";
    else if (quarter === "Q3") quarterCondition = "AND EXTRACT(MONTH FROM \"createdAt\") BETWEEN 7 AND 9";
    else if (quarter === "Q4") quarterCondition = "AND EXTRACT(MONTH FROM \"createdAt\") BETWEEN 10 AND 12";
  }

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
    ${sourceCondition}
    ${quarterCondition}
    GROUP BY month, "status"
    ORDER BY month ASC;
  `);

  return NextResponse.json(data);
}