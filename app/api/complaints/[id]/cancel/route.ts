import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findZoneByLatLng } from "@/lib/zone/service";
import { getSettingByKey } from "@/lib/settings/service";
import { notifyLineUserAndLineGroup } from "@/lib/line/notify";
import { notifyTelegramGroupForComplaint } from "@/lib/telegram/notify";

function extractLatLng(location?: string): [number, number] | null {
    if (!location) return null;
    const match = location.match(/(-?\d+\.\d+)[, ]+(-?\d+\.\d+)/);
    if (!match) return null;
    return [parseFloat(match[1]), parseFloat(match[2])];
}

// PATCH /api/complaints/[id]/cancel
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Parse JSON body
    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const userId = body.userId;

    // Basic validation
    if (!id || typeof id !== "string") {
        return NextResponse.json({ message: "รหัสไม่ถูกต้อง" }, { status: 400 });
    }
    if (!userId || typeof userId !== "string") {
        return NextResponse.json({ message: "userId ไม่ถูกต้อง" }, { status: 400 });
    }

    // Find complaint
    const complaint = await prisma.complaint.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
            source: true,
            lineUserId: true,
            location: true
        }
    });

    if (!complaint) {
        return NextResponse.json({ message: "ไม่พบเรื่องร้องเรียน" }, { status: 404 });
    }
    if (complaint.status !== "PENDING") {
        return NextResponse.json({ message: "ยกเลิกได้เฉพาะเรื่องที่รอดำเนินการ" }, { status: 400 });
    }
    if (complaint.source !== "LINE") {
        return NextResponse.json({ message: "เรื่องร้องเรียนนี้ไม่ได้มาจาก LINE" }, { status: 400 });
    }
    if (complaint.lineUserId !== userId) {
        return NextResponse.json({ message: "คุณไม่มีสิทธิ์ยกเลิกเรื่องนี้" }, { status: 403 });
    }

    let zoneId: string | null = null;
    let zoneName: string | null = null;
    let lineGroupId: string | null = null;
    const latLng = extractLatLng(complaint.location as string);

    if (!latLng) {
        return NextResponse.json({ message: "location ต้องเป็น lat,lng ที่ถูกต้อง" }, { status: 400 });
    }

    if (latLng) {
        const [lat, lng] = latLng;
        const zone = await findZoneByLatLng(lat, lng);
        if (zone) {
            zoneId = zone.id;
            zoneName = zone.name;
            lineGroupId = zone.lineGroupId ?? null;
        }
    }

    if (!lineGroupId) {
        const zoneMain = await prisma.zone.findFirst({ where: { name: "โซนกลาง" } });
        if (zoneMain) {
            lineGroupId = zoneMain.lineGroupId ?? null;
            zoneId = zoneMain.id;
            zoneName = zoneMain.name;
        }
    }

    if (!lineGroupId) return NextResponse.json({ message: "ไม่พบ group สำหรับแจ้งเตือน (โซนกลาง)" }, { status: 400 });

    // อัปเดตสถานะเป็น CANCELLED
    const complaintUpdate = await prisma.complaint.update({
        where: { id },
        data: {
            status: "CANCELLED",
            updatedAt: new Date(),
        },
        include: { reopenLogs: true }
    });

    try {
        const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
        const token = tokenSetting?.value ?? null;
        if (!token) {
            console.error("[แจ้งเตือน] ไม่พบ LINE_ACCESS_TOKEN ใน DB");
        }
        if (lineGroupId && token) {
            await notifyLineUserAndLineGroup(complaintUpdate, lineGroupId, token);
        }
        await notifyTelegramGroupForComplaint(complaintUpdate);
    } catch (error:any) {
        console.error("[แจ้งเตือน] ERROR:",  error, error?.response?.data);
    }

    return NextResponse.json({ message: "ยกเลิกสำเร็จ", complaint: complaintUpdate });
}
