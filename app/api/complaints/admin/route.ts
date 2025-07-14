import { prisma } from "@/lib/prisma";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { NextRequest, NextResponse } from "next/server";
import { createComplaint } from "@/lib/complaint/service";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { randomUUID } from "crypto";
import { ComplaintSource } from "@prisma/client";
import { findZoneByLatLng } from "@/lib/zone/service";
import { notifyLineGroup } from "@/lib/line/notify";
import { notifyTelegramGroupForComplaint } from "@/lib/telegram/notify";
import { getSettingByKey } from "@/lib/settings/service";

function extractLatLng(location?: string): [number, number] | null {
    if (!location) return null;
    // หาตัวเลข float 2 ค่าแรกใน string
    const match = location.match(/(-?\d+\.\d+)[, ]+(-?\d+\.\d+)/);
    if (!match) return null;
    return [parseFloat(match[1]), parseFloat(match[2])];
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // ✅ ถ้ามี session และ role เป็น ADMIN หรือ SUPERADMIN ให้ผ่านได้ ไม่ต้องใช้ x-api-key
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
            // ถ้าไม่มี session → ใช้ apiKeyAuth ตรวจสอบ
            const authResult = await apiKeyAuth(req);
            if (authResult instanceof NextResponse) return authResult;
        }

        const formData = await req.formData();
        const description = formData.get("description")?.toString();
        const receivedBy = formData.get("receivedBy")?.toString();
        const reporterName = formData.get("reporterName")?.toString();
        const phone = formData.get("phone")?.toString();
        const location = formData.get("location")?.toString();
        const sourceParam = formData.get("source")?.toString() || "PHONE";
        const validSources: ComplaintSource[] = ["LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"];
        if (!validSources.includes(sourceParam as ComplaintSource)) {
            return NextResponse.json({ error: "source ไม่ถูกต้อง" }, { status: 400 });
        }
        const source = sourceParam as ComplaintSource;

        if (!description || !receivedBy || !reporterName) {
            return NextResponse.json({ error: "ต้องมี description, receivedBy, และ reporterName" }, { status: 400 });
        }

        if (!location || location.trim() === "" || !extractLatLng(location)) {
            return NextResponse.json({ error: "ต้องมี location ที่ถูกต้อง (lat,lng)" }, { status: 400 });
        }

        // ✅ รองรับการอัปโหลดรูป
        const imageFiles = formData.getAll("imageBeforeFiles") as File[];
        let imageBeforeUrls: string[] = [];
        if (imageFiles && imageFiles.length > 0) {
            imageBeforeUrls = await Promise.all(
                imageFiles.map(async (file) => {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const filename = `imageBefore-${randomUUID()}.jpg`;
                    return await uploadImageToSupabase(buffer, filename);
                })
            );
        }

        let lineGroupId: string | null = null;
        let zoneId: string | null = null;
        let zoneName: string | null = null;
        let lat = null, lng = null;
        const latLng = extractLatLng(location);

        if (!latLng) {
            return NextResponse.json({ error: "location ต้องเป็น lat,lng ที่ถูกต้อง" }, { status: 400 });
        }

        if (latLng) {
            [lat, lng] = latLng;
            const zone = await findZoneByLatLng(lat, lng);
            if (zone) {
                lineGroupId = zone.lineGroupId ?? null;
                zoneId = zone.id;
                zoneName = zone.name;
            }
        }

        if (!zoneId || !lineGroupId) {
            const middleZone = await prisma.zone.findFirst({
                where: { name: "โซนกลาง" },
            });
            if (middleZone) {
                lineGroupId = middleZone.lineGroupId ?? null;
                zoneId = middleZone.id;
                zoneName = middleZone.name;
            }
        }

        if (!lineGroupId) {
            return NextResponse.json({ error: "ไม่พบ group สำหรับแจ้งเตือน (โซนกลาง)" }, { status: 400 });
        }

        const complaint = await createComplaint({
            source,
            description,
            receivedBy,
            reporterName,
            phone,
            location,
            imageBefore: imageBeforeUrls.join(","),
            zoneId: zoneId ?? undefined,
            zoneName: zoneName ?? undefined,
        });

        if (lineGroupId) {
            const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
            const groupToken = tokenSetting?.value ?? null;
            if (groupToken) {
                await notifyLineGroup(lineGroupId, complaint, groupToken);
            }
        }

        await notifyTelegramGroupForComplaint(complaint);

        return NextResponse.json(complaint);
    } catch (error) {
        console.error("[POST /api/complaints/admin] Error:", error);
        const errorMessage = (error instanceof Error) ? error.message : "Internal server error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}