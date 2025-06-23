import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: params.id },
  });

  if (!apiKey || apiKey.userId !== session.user.id) {
    return NextResponse.json({ error: "API Key ไม่ถูกต้องหรือไม่มีสิทธิ์" }, { status: 403 });
  }

  if (!apiKey.revokedAt) {
    return NextResponse.json({ error: "ต้องยกเลิกก่อนจึงจะลบถาวรได้" }, { status: 400 });
  }

  await prisma.apiKey.delete({
    where: { id: id },
  });

  return NextResponse.json({ message: "ลบ API Key ถาวรแล้ว" });
}
