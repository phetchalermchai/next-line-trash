import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyLineUserAndLineGroup } from "@/lib/line/notify";
import { notifyTelegramGroupForComplaint } from "@/lib/telegram/notify";
import dayjs from "dayjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // รับ body: { userId, reason }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const { userId, reason = "" } = body;

  // Validation
  if (!id || typeof id !== "string") return NextResponse.json({ message: "id ไม่ถูกต้อง" }, { status: 400 });
  if (!userId || typeof userId !== "string") return NextResponse.json({ message: "userId ไม่ถูกต้อง" }, { status: 400 });

  // 1. ดึง complaint และตรวจสอบสิทธิ์
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { reopenLogs: true }
  });

  if (!complaint) return NextResponse.json({ message: "ไม่พบเรื่องร้องเรียน" }, { status: 404 });
  if (complaint.status !== "DONE") return NextResponse.json({ message: "ขอแก้ไขได้เฉพาะงานที่ปิดเสร็จ" }, { status: 400 });
  if (complaint.source !== "LINE") return NextResponse.json({ message: "ต้องเป็นเรื่องร้องเรียนที่มาจาก LINE เท่านั้น" }, { status: 400 });
  if (complaint.lineUserId !== userId) return NextResponse.json({ message: "คุณไม่มีสิทธิ์ร้องขอแก้ไข" }, { status: 403 });

  // ตรวจสอบวัน (3 วันหลังปิดงาน)
  const doneDate = complaint.updatedAt ?? complaint.createdAt;
  const diffDay = dayjs().diff(dayjs(doneDate), "day");
  if (diffDay >= 3) return NextResponse.json({ message: "หมดเวลาร้องขอแก้ไข (ภายใน 3 วันหลังปิดงาน)" }, { status: 400 });

  // 2. เพิ่ม log + อัปเดต status
  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status: "REOPENED",
      reopenLogs: {
        create: {
          reason: reason || "-",
          reporterName: complaint.reporterName || "-",
        }
      }
    },
    include: { reopenLogs: true }
  });

  // 3. แจ้งเตือน Line & Telegram
  try {
    // ดึง lineGroupId (แล้วแต่ logic zone ของคุณ)
    const groupId = complaint.zoneId ? (await prisma.zone.findUnique({ where: { id: complaint.zoneId } }))?.lineGroupId : null;
    const token = (await prisma.setting.findUnique({ where: { key: "LINE_ACCESS_TOKEN" } }))?.value;

    if (groupId && token) {
      await notifyLineUserAndLineGroup(updated, groupId, token);
    }
    await notifyTelegramGroupForComplaint(updated);
  } catch (error) {
    console.error("[แจ้งเตือนขอแก้ไข] ERROR:", error);
  }

  return NextResponse.json({ message: "ร้องขอแก้ไขงานเรียบร้อย", complaint: updated });
}
