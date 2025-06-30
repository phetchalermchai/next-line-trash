import { prisma } from "@/lib/prisma";
import { ComplaintStatus, ComplaintSource } from "@prisma/client";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";

export async function createComplaint(data: {
  source: ComplaintSource;
  description: string;
  lineUserId?: string;
  receivedBy?: string;
  reporterName?: string;
  phone?: string;
  location?: string;
  message?: string;
  imageBefore?: string;
}) {
  return prisma.complaint.create({
    data: {
      source: data.source,
      description: data.description,
      lineUserId: data.lineUserId ?? "",
      receivedBy: data.receivedBy ?? "",
      reporterName: data.reporterName ?? "",
      phone: data.phone ?? "",
      location: data.location ?? "",
      message: data.message ?? "",
      imageBefore: data.imageBefore ?? "",
      status: ComplaintStatus.PENDING,
    },
  });
}

export async function findComplaintById(id: string) {
  return prisma.complaint.findUnique({ where: { id } });
}

export async function updateComplaint(id: string, data: any, files: { imageBeforeFiles?: File[]; imageAfterFiles?: File[] }) {
  const found = await prisma.complaint.findUnique({ where: { id } });
  if (!found) throw new Error(`ไม่พบรายการร้องเรียนที่มี ID: ${id}`);

  const updateData: any = {
    source: data.source as ComplaintSource,
    receivedBy: (data.receivedBy ?? "").trim(),
    reporterName: (data.reporterName ?? "").trim(),
    phone: data.phone,
    description: data.description,
    message: (data.message ?? "").trim(),
    status: data.status as ComplaintStatus,
    location: data.location,
    updatedAt: new Date(),
  };

  async function handleImageUpdate(field: "imageBefore" | "imageAfter", uploadFiles?: File[], oldValue?: string | null) {
    const oldUrls = oldValue?.split(",") ?? [];
    const keepUrls = (data[field]?.split(",") ?? []).map((s: string) => s.trim()).filter((url: string) => url && oldUrls.includes(url));

    const uploadedUrls: string[] = [];
    if (uploadFiles?.length) {
      for (const file of uploadFiles) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${field}-${id}-${crypto.randomUUID()}.jpg`;
        const url = await uploadImageToSupabase(buffer, filename);
        uploadedUrls.push(url);
      }
    }

    const deleteUrls = oldUrls.filter((url) => !keepUrls.includes(url));
    for (const url of deleteUrls) {
      // TODO: ลบไฟล์จาก Supabase ถ้ามี logic
    }

    return [...keepUrls, ...uploadedUrls].filter(Boolean).join(",");
  }

  updateData.imageBefore = await handleImageUpdate("imageBefore", files.imageBeforeFiles, found.imageBefore);
  updateData.imageAfter = await handleImageUpdate("imageAfter", files.imageAfterFiles, found.imageAfter);

  return prisma.complaint.update({ where: { id }, data: updateData });
}

export async function deleteComplaint(id: string): Promise<boolean> {
  const found = await prisma.complaint.findUnique({ where: { id } });
  if (!found) return false;

  const allImageUrls = [
    ...(found.imageBefore?.split(",") || []),
    ...(found.imageAfter?.split(",") || []),
  ];

  for (const url of allImageUrls) {
    try {
      // TODO: ลบไฟล์จาก Supabase ถ้ามี logic
    } catch (err) {
      console.error("ลบภาพล้มเหลว:", url, err);
    }
  }

  await prisma.complaint.delete({ where: { id } });
  return true;
}