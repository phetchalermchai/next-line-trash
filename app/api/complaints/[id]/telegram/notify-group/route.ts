import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { prisma } from "@/lib/prisma";
import { notifyManualTelegramGroupReminder } from "@/lib/telegram/notify";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    // ใส่ logic check เหมือน Line เช่น: ถ้ายังไม่ครบ 1 วัน หรือ status DONE ให้ reject
    const now = new Date();
    if (complaint.notifiedAt) {
      const diff = now.getTime() - new Date(complaint.notifiedAt).getTime();
      const diffDays = diff / (1000 * 60 * 60 * 24);
      if (diffDays < 1) {
        return NextResponse.json({ error: "แจ้งเตือนได้วันละครั้งเท่านั้น" }, { status: 400 });
      }
    }
    if (complaint.status === "DONE") {
      return NextResponse.json({ error: "ไม่สามารถแจ้งเตือนได้ เนื่องจากเรื่องนี้ดำเนินการเสร็จแล้ว" }, { status: 400 });
    }

    // อัปเดต notifiedAt
    await prisma.complaint.update({
      where: { id },
      data: { notifiedAt: now },
    });

     // ส่ง telegram
    await notifyManualTelegramGroupReminder(complaint);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[NOTIFY TELEGRAM GROUP] Error:", error);
    return NextResponse.json({ error: error.message || "Notify failed" }, { status: 500 });
  }
}