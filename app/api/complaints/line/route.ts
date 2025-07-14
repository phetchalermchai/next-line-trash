import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createComplaint } from "@/lib/complaint/service";
import { notifyLineUserAndLineGroup } from "@/lib/line/notify";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { randomUUID } from "crypto";
import { findZoneByLatLng } from "@/lib/zone/service";
import { getSettingByKey } from "@/lib/settings/service";
import { notifyTelegramGroupForComplaint } from "@/lib/telegram/notify";

function extractLatLng(location?: string): [number, number] | null {
  if (!location) return null;
  const match = location.match(/(-?\d+\.\d+)[, ]+(-?\d+\.\d+)/);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2])];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const reporterName = formData.get("reporterName")?.toString();
    const phone = formData.get("phone")?.toString();
    const description = formData.get("description")?.toString();
    const lineUserId = formData.get("lineUserId")?.toString();
    const location = formData.get("location")?.toString();
    const imageFilesRaw = formData.getAll("imageBeforeFiles");
    const imageFiles = imageFilesRaw.filter((f): f is File => f instanceof File);

    if (!description || !lineUserId || !location || lineUserId.trim() === "" || location.trim() === "") {
      return NextResponse.json({ error: "ต้องมี description, lineUserId, และ location ที่ถูกต้อง" }, { status: 400 });
    }

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ error: "ต้องแนบรูปอย่างน้อย 1 รูป" }, { status: 400 });
    }

    let zoneId: string | null = null;
    let zoneName: string | null = null;
    let lineGroupId: string | null = null;
    const latLng = extractLatLng(location);

    if (!latLng) {
      return NextResponse.json({ error: "location ต้องเป็น lat,lng ที่ถูกต้อง" }, { status: 400 });
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
      const zoneMain = await prisma.zone.findFirst({
        where: { name: "โซนกลาง" }
      });
      if (zoneMain) {
        lineGroupId = zoneMain.lineGroupId ?? null;
        zoneId = zoneMain.id;
        zoneName = zoneMain.name;
      }
    }

    if (!lineGroupId) {
      return NextResponse.json({ error: "ไม่พบ group สำหรับแจ้งเตือน (โซนกลาง)" }, { status: 400 });
    }

    const imageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `imageBefore-${randomUUID()}.jpg`;
        return await uploadImageToSupabase(buffer, filename);
      })
    );

    const complaint = await createComplaint({
      source: "LINE",
      description,
      lineUserId,
      reporterName,
      location,
      phone,
      imageBefore: imageUrls.join(","),
      zoneId: zoneId ?? undefined,
      zoneName: zoneName ?? undefined,
    });

    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
    const token = tokenSetting?.value ?? null;

    if (!token) {
      return NextResponse.json({ error: "ไม่พบ LINE_ACCESS_TOKEN ใน DB" }, { status: 400 });
    }

    if (lineGroupId && token) {
      await notifyLineUserAndLineGroup(complaint, lineGroupId, token);
    }

    await notifyTelegramGroupForComplaint(complaint);

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("[POST /api/complaints/line] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}