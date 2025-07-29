import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { isValidComplaintStatus, isValidComplaintSource } from "@/lib/enum-utils";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // ✅ ถ้ามี session และ role เป็น ADMIN หรือ SUPERADMIN ให้ผ่านได้ ไม่ต้องใช้ x-api-key
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    // ถ้าไม่มี session → ใช้ apiKeyAuth ตรวจสอบ
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }
  const { searchParams } = req.nextUrl;

  const search = searchParams.get("search") || undefined;
  const statusParam = searchParams.get("status");
  const sourceParam = searchParams.get("source");
  const status = isValidComplaintStatus(statusParam) ? statusParam : undefined;
  const source = isValidComplaintSource(sourceParam) ? sourceParam : undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const conditions: any[] = [];

  if (statusParam && !isValidComplaintStatus(statusParam)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (sourceParam && !isValidComplaintSource(sourceParam)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  if (search) {
    conditions.push({
      OR: [
        { description: { contains: search, mode: "insensitive" } },
        { reporterName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (status) conditions.push({ status });
  if (source) conditions.push({ source });
  if (startDate) conditions.push({ createdAt: { gte: new Date(startDate) } });
  if (endDate) conditions.push({ createdAt: { lte: new Date(endDate) } });

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [items, total] = await prisma.$transaction([
    prisma.complaint.findMany({
      where,
      include: { reopenLogs: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);

  return NextResponse.json({
    items,
    totalPages: Math.ceil(total / limit),
  });
}
