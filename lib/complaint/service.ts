import { prisma } from "@/lib/prisma";
import { ComplaintStatus, ComplaintSource } from "@prisma/client";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { deleteImageFromSupabase } from "../storage/deleted-image";

export async function createComplaint(data: {
  source: ComplaintSource;
  description: string;
  lineUserId?: string;
  receivedBy?: string;
  reporterName?: string;
  phone?: string;
  location?: string;
  zoneId?: string;
  zoneName?: string;
  message?: string;
  imageBefore?: string;
}) {
  return prisma.complaint.create({
    data: {
      source: data.source,
      description: data.description,
      lineUserId: data.lineUserId,
      receivedBy: data.receivedBy,
      reporterName: data.reporterName,
      phone: data.phone,
      location: data.location,
      zoneId: data.zoneId,
      zoneName: data.zoneName,
      message: data.message,
      imageBefore: data.imageBefore,
      status: ComplaintStatus.PENDING,
    },
    include: { reopenLogs: true }
  });
}

export async function findComplaintById(id: string) {
  return prisma.complaint.findUnique({ where: { id } });
}

export async function updateComplaint(id: string, data: any, files: { imageBeforeFiles?: File[]; imageAfterFiles?: File[] }) {
  const found = await prisma.complaint.findUnique({ where: { id } });
  if (!found) throw new Error("Complaint not found");

  const handleImageUpdate = async (field: "imageBefore" | "imageAfter", files?: File[], oldValue?: string | null) => {
    const oldUrls = oldValue?.split(",") ?? [];
    const keepUrls = (data[field]?.toString().split(",") ?? []).map((s: string) => s.trim()).filter((url: string) => url && oldUrls.includes(url));

    const uploadedUrls: string[] = [];
    if (files?.length) {
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${field}-${id}-${crypto.randomUUID()}.jpg`;
        const url = await uploadImageToSupabase(buffer, filename);
        uploadedUrls.push(url);
      }
    }

    const deleteUrls = oldUrls.filter((url) => !keepUrls.includes(url));
    for (const url of deleteUrls) {
      try {
        if (url) await deleteImageFromSupabase(url);
      } catch (err) {
        console.warn(`[deleteImageFromSupabase] Warning: Could not delete ${url}`, err);
      }
    }

    return [...keepUrls, ...uploadedUrls].filter(Boolean).join(",");
  };

  const updateData = {
    source: data.source,
    receivedBy: data.receivedBy,
    reporterName: data.reporterName,
    phone: data.phone,
    description: data.description,
    message: data.message,
    status: data.status,
    location: data.location,
    updatedAt: new Date(),
    imageBefore: await handleImageUpdate("imageBefore", files.imageBeforeFiles, found.imageBefore),
    imageAfter: await handleImageUpdate("imageAfter", files.imageAfterFiles, found.imageAfter),
  };

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
    if (!url) continue;
    try {
      await deleteImageFromSupabase(url);
    } catch (err) {
      console.error("ลบภาพล้มเหลว:", url, err);
    }
  }

  await prisma.complaint.delete({ where: { id } });
  return true;
}