import { NextRequest, NextResponse } from "next/server";
import { createComplaint } from "@/lib/complaint/service";
import { notifyUserAndGroup } from "@/lib/line/notify";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { randomUUID } from "crypto";

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

    if (!description || !lineUserId || lineUserId.trim() === "") {
      return NextResponse.json({ error: "ต้องมี description และ lineUserId ที่ถูกต้อง" }, { status: 400 });
    }

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ error: "ต้องแนบรูปอย่างน้อย 1 รูป" }, { status: 400 });
    }

    const imageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `complaint-${randomUUID()}.jpg`;
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
    });

    await notifyUserAndGroup(complaint.id);

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("[POST /api/complaints/line] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}