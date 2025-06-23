// 📁 app/api/user/api-keys/[id]/restore/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = await params
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restored = await prisma.apiKey.updateMany({
    where: {
      id: id,
      userId: session.user.id,
      revokedAt: { not: null },
    },
    data: {
      revokedAt: null,
    },
  });

  if (restored.count === 0) {
    return NextResponse.json({ error: "ไม่สามารถย้อนกลับ API Key นี้ได้" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
