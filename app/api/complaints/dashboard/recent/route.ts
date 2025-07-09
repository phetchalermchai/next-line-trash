import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return NextResponse.json(items);
}