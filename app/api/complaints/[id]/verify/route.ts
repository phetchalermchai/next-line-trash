import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return NextResponse.json({ message: "ไม่พบเรื่องร้องเรียน" }, { status: 404 });
    }
    if (complaint.status !== "DONE") {
      return NextResponse.json({ message: "สถานะต้องเป็น DONE เท่านั้น" }, { status: 400 });
    }
    if (complaint.verifiedAt) {
      return NextResponse.json({ message: "รายการนี้ถูก VERIFIED ไปแล้ว" }, { status: 400 });
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

    // TODO: แจ้งเตือน/Log ฯลฯ

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error("[VERIFY PATCH ERROR]", error);

    // Prisma error หรือ error อื่นๆ
    if (error.code === "P2023" || error.code === "P2025") {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: error?.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ" },
      { status: 500 }
    );
  }
}
