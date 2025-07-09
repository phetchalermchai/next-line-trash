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

  if (groupBySource) {
    const data = await prisma.complaint.groupBy({
      by: ["source", "createdAt"],
      _count: { id: true },
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00+07:00`),
          lte: new Date(`${year}-12-31T23:59:59+07:00`),
        },
      },
    });

    const countsByMonthAndSource = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const sources = ["LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"];

      return sources.map(source => {
        const monthSourceItems = data.filter(
          (item) => new Date(item.createdAt).toLocaleString("en-US", { timeZone: "Asia/Bangkok" }).split("/")[0] == month.toString() && item.source === source
        );
        const count = monthSourceItems.reduce((sum, item) => sum + (item._count.id || 0), 0);
        return { month, count, source };
      });
    }).flat();

    return NextResponse.json(countsByMonthAndSource);
  }

  const monthlyCounts = await prisma.complaint.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00+07:00`),
        lte: new Date(`${year}-12-31T23:59:59+07:00`),
      },
    },
  });

  const countsByMonth = Array.from({ length: 12 }, (_, i) => {
    const monthItems = monthlyCounts.filter(
      (item) => new Date(item.createdAt).toLocaleString("en-US", { timeZone: "Asia/Bangkok" }).split("/")[0] == (i + 1).toString()
    );
    const count = monthItems.reduce((sum, item) => sum + (item._count.id || 0), 0);
    return { month: i + 1, count };
  });

  return NextResponse.json(countsByMonth);
}
