import { NextRequest, NextResponse } from "next/server";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { findComplaintById, updateComplaint, deleteComplaint } from "@/lib/complaint/service";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notifyLineGroup, notifyLineUserAndLineGroup } from "@/lib/line/notify";
import { notifyTelegramGroupForComplaint } from "@/lib/telegram/notify";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const complaint = await findComplaintById(id);

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  return NextResponse.json(complaint);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  const formData = await req.formData();
  const data: Record<string, FormDataEntryValue> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  const imageBeforeFiles = formData.getAll("imageBeforeFiles") as File[];
  const imageAfterFiles = formData.getAll("imageAfterFiles") as File[];

  if (imageBeforeFiles.length > 5) {
    return NextResponse.json({ error: "อัปโหลดภาพก่อนสูงสุดได้ไม่เกิน 5 ไฟล์" }, { status: 400 });
  }
  if (imageAfterFiles.length > 5) {
    return NextResponse.json({ error: "อัปโหลดภาพหลังสูงสุดได้ไม่เกิน 5 ไฟล์" }, { status: 400 });
  }

  try {
    const oldComplaint = await findComplaintById(id);
    const updated = await updateComplaint(id, data, {
      imageBeforeFiles,
      imageAfterFiles,
    });

    if (oldComplaint?.status !== "REJECTED" && updated.status === "REJECTED") {
      const zone = updated.zoneId
        ? await prisma.zone.findUnique({ where: { id: updated.zoneId } })
        : null;
      const groupId = zone?.lineGroupId ?? null;
      const tgGroupId = zone?.telegramGroupId ?? null;

      const lineToken = (await prisma.setting.findUnique({ where: { key: "LINE_ACCESS_TOKEN" } }))?.value ?? "";
      const tgToken = (await prisma.setting.findUnique({ where: { key: "TELEGRAM_BOT_TOKEN" } }))?.value ?? "";

      if (groupId && lineToken) {
        await notifyLineUserAndLineGroup(updated, groupId, lineToken);
      } else if (groupId && lineToken) {
        await notifyLineGroup(groupId, updated, lineToken);
      }
      if (tgGroupId && tgToken) {
        await notifyTelegramGroupForComplaint(updated);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH Complaint] Error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  try {
    const success = await deleteComplaint(id);
    if (!success) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Complaint deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE Complaint] Error:", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}