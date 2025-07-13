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
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const sourceParam = searchParams.get("source");

  const validSources: ComplaintSource[] = ["LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"];
  const where = sourceParam && sourceParam !== "ALL" && validSources.includes(sourceParam as ComplaintSource)
    ? { source: sourceParam as ComplaintSource }
    : {};

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(complaints);
}