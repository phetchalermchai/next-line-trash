// PATCH /api/complaints/[id]/reopen-superadmin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyLineUserAndLineGroup } from "@/lib/line/notify";
import { notifyTelegramGroupForComplaint } from "@/lib/telegram/notify";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
        return NextResponse.json({ message: "ต้องเป็น SUPERADMIN เท่านั้น" }, { status: 403 });
    }

    let body: any = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }
    const { reason } = body;

    if (!reason || reason.trim().length < 3) {
        return NextResponse.json({ message: "โปรดระบุเหตุผล (อย่างน้อย 3 ตัวอักษร)" }, { status: 400 });
    }

    // อนุญาตเฉพาะ status DONE
    const complaint = await prisma.complaint.findUnique({
        where: { id },
        include: { reopenLogs: true }
    });
    if (!complaint) return NextResponse.json({ message: "ไม่พบเรื่องร้องเรียน" }, { status: 404 });
    if (complaint.status !== "DONE") return NextResponse.json({ message: "Reopen ได้เฉพาะงานที่ DONE เท่านั้น" }, { status: 400 });

    // อัปเดต status + log
    const updated = await prisma.complaint.update({
        where: { id },
        data: {
            status: "REOPENED",
            reopenLogs: {
                create: {
                    reason: reason.trim(),
                    reporterName: session.user.name || session.user.email || "-",
                }
            }
        },
        include: { reopenLogs: true }
    });

    // แจ้งเตือน
    try {
        const zone = updated.zoneId
            ? await prisma.zone.findUnique({ where: { id: updated.zoneId } })
            : null;
        const groupId = zone?.lineGroupId ?? null;
        const tgGroupId = zone?.telegramGroupId ?? null;
        const lineToken = (await prisma.setting.findUnique({ where: { key: "LINE_ACCESS_TOKEN" } }))?.value ?? "";
        const tgToken = (await prisma.setting.findUnique({ where: { key: "TELEGRAM_BOT_TOKEN" } }))?.value ?? "";

        if (groupId && lineToken && updated.lineUserId) {
            await notifyLineUserAndLineGroup(updated, groupId, lineToken);
        } else if (groupId && lineToken) {
            await import("@/lib/line/notify").then(m => m.notifyLineGroup(groupId, updated, lineToken));
        }
        if (tgGroupId && tgToken) {
            await notifyTelegramGroupForComplaint(updated);
        }
    } catch (error) {
        console.error("[แจ้งเตือน REOPENED SUPERADMIN] ERROR:", error);
    }

    return NextResponse.json({ message: "REOPENED เรียบร้อย", complaint: updated });
}
