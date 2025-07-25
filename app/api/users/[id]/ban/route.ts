import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.status !== "APPROVED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: id },
      data: { status: UserStatus.BANNED },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถยกเลิกผู้ใช้ได้" }, { status: 500 });
  }
}
