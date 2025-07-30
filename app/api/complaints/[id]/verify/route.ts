import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verifiedBy: session.user.id,
      autoVerified: false,
    },
  });

  // แจ้งเตือนได้ถ้าต้องการ...
  return NextResponse.json(updated);
}
