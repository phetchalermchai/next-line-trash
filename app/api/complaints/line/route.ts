import { NextRequest, NextResponse } from "next/server";
import { createComplaint } from "@/lib/complaint/service";
import { notifyUserAndGroup } from "@/lib/line/notify";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const description = formData.get("description")?.toString();
  const lineUserId = formData.get("lineUserId")?.toString();
  const imageFiles = formData.getAll("imageBeforeFiles") as File[];

  if (!description || !lineUserId) {
    return NextResponse.json({ error: "ต้องมี description และ lineUserId" }, { status: 400 });
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
    imageBefore: imageUrls.join(","),
  });

  await notifyUserAndGroup(complaint.id);

  return NextResponse.json(complaint);
}
