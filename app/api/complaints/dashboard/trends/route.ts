import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const groupBySource = searchParams.get("groupBySource") === "true";
  const quarter = searchParams.get("quarter") || "ALL";
  const sourceFilter = searchParams.get("source") || "ALL";

  let startMonth = 1;
  let endMonth = 12;

  if (quarter === "Q1") {
    startMonth = 1; endMonth = 3;
  } else if (quarter === "Q2") {
    startMonth = 4; endMonth = 6;
  } else if (quarter === "Q3") {
    startMonth = 7; endMonth = 9;
  } else if (quarter === "Q4") {
    startMonth = 10; endMonth = 12;
  }

  const where: any = {
    createdAt: {
      gte: new Date(`${year}-${startMonth.toString().padStart(2, '0')}-01T00:00:00+07:00`),
      lte: new Date(`${year}-${endMonth.toString().padStart(2, '0')}-31T23:59:59+07:00`),
    },
  };

  if (sourceFilter !== "ALL") {
    where.source = sourceFilter;
  }

  if (groupBySource) {
    const data = await prisma.complaint.groupBy({
      by: ["source", "createdAt"],
      _count: { id: true },
      where,
    });

    const sources = ["LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"];

    const countsByMonthAndSource = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;

      return sources.map(source => {
        const monthSourceItems = data.filter(
          (item) => new Date(item.createdAt).getMonth() + 1 === month && item.source === source
        );
        const count = monthSourceItems.reduce((sum, item) => sum + (item._count.id || 0), 0);
        return { month, count, source };
      });
    }).flat().filter(item => item.month >= startMonth && item.month <= endMonth);

    return NextResponse.json(countsByMonthAndSource);
  }

  const monthlyCounts = await prisma.complaint.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    where,
  });

  const countsByMonth = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthItems = monthlyCounts.filter(
      (item) => new Date(item.createdAt).getMonth() + 1 === month
    );
    const count = monthItems.reduce((sum, item) => sum + (item._count.id || 0), 0);
    return { month, count };
  }).filter(item => item.month >= startMonth && item.month <= endMonth);

  return NextResponse.json(countsByMonth);
}
