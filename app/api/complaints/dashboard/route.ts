// ✅ ปรับ Path API เป็น /api/complaints/dashboard/*
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from "date-fns";

// 1️⃣ /api/complaints/dashboard/summary
export async function GET_summary() {
  const total = await prisma.complaint.count();
  const done = await prisma.complaint.count({ where: { status: "DONE" } });
  const pending = await prisma.complaint.count({ where: { status: "PENDING" } });
  const latest = await prisma.complaint.findFirst({ orderBy: { updatedAt: "desc" } });

  return NextResponse.json({
    total,
    done,
    pending,
    latestUpdatedAt: latest ? latest.updatedAt.toISOString() : null,
  });
}

// 2️⃣ /api/complaints/dashboard/trends
export async function GET_trends() {
  const thisYear = new Date().getFullYear();
  const data = await prisma.complaint.groupBy({
    by: ["status"],
    _count: { id: true },
    where: {
      createdAt: {
        gte: new Date(`${thisYear}-01-01`),
        lte: new Date(`${thisYear}-12-31`),
      },
    },
  });

  return NextResponse.json(data);
}

// 3️⃣ /api/complaints/dashboard/status-summary
export async function GET_statusSummary() {
  const data = await prisma.complaint.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  return NextResponse.json(data);
}

// 4️⃣ /api/complaints/dashboard/recent
export async function GET_recent() {
  const items = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return NextResponse.json(items);
}

// 5️⃣ /api/complaints/dashboard/monthly-status
export async function GET_monthlyStatus() {
  const thisYear = new Date().getFullYear();

  const data = await prisma.complaint.groupBy({
    by: ["status"],
    _count: { id: true },
    where: {
      createdAt: {
        gte: new Date(`${thisYear}-01-01`),
        lte: new Date(`${thisYear}-12-31`),
      },
    },
  });

  return NextResponse.json(data);
}
