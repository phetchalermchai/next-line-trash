import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { notifyReportResultToLineGroup, notifyReportResultToLineUser } from "@/lib/line/notify";
import { randomUUID } from "crypto";
import { notifyTelegramGroupReport } from "@/lib/telegram/notify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  const formData = await req.formData();
  const message = formData.get("message")?.toString() || "";
  const imageAfterFiles = formData.getAll("imageAfterFiles") as File[];

  if (imageAfterFiles.length > 5) {
    return NextResponse.json({ error: "แนบรูปได้ไม่เกิน 5 รูป" }, { status: 400 });
  }
  
  for (const file of imageAfterFiles) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "แนบได้เฉพาะไฟล์ภาพเท่านั้น" }, { status: 400 });
    }
    if (file.size > 3 * 1024 * 1024) { // 3MB
      return NextResponse.json({ error: "แต่ละไฟล์ต้องไม่เกิน 3MB" }, { status: 400 });
    }
  }

  if (!message.trim()) {
    return NextResponse.json({ error: "กรุณากรอกสรุปผล" }, { status: 400 });
  }

  try {
    const found = await prisma.complaint.findUnique({ where: { id } });
    if (!found) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    if (found.status === "DONE") {
      return NextResponse.json({ error: "รายการนี้ถูกรายงานผลไปแล้ว" }, { status: 400 });
    }

    if (found.status === "VERIFIED") {
      return NextResponse.json({ error: "รายการนี้ถูกตรวจสอบแล้ว" }, { status: 400 });
    }

    let groupId: string | null = null;
    if (found.zoneId) {
      const zone = await prisma.zone.findUnique({ where: { id: found.zoneId } });
      groupId = zone?.lineGroupId ?? null;
    }

    if (!groupId) {
      const middleZone = await prisma.zone.findFirst({ where: { name: "โซนกลาง" } });
      groupId = middleZone?.lineGroupId ?? null;
    }

    const uploadedUrls: string[] = [];
    for (const file of imageAfterFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `imageAfter-${randomUUID()}.jpg`;
      const url = await uploadImageToSupabase(buffer, filename);
      uploadedUrls.push(url);
    }

    const cleanedUrls = [...(found.imageAfter?.split(",") || []), ...uploadedUrls]
      .map((url) => url.trim())
      .filter((url) => url && url !== "")
      .join(",");

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        message,
        status: "DONE",
        updatedAt: new Date(),
        imageAfter: cleanedUrls,
      },
      include: { reopenLogs: true }
    });

    if (groupId) {
      await notifyReportResultToLineGroup(id, message, groupId);
    }
    if (updated.lineUserId && updated.source === "LINE") {
      await notifyReportResultToLineUser(id, message, updated.lineUserId);
    }

    await notifyTelegramGroupReport(updated, message);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[REPORT Complaint] Error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}