import { prisma } from "@/lib/prisma";
import { ComplaintStatus, ComplaintSource } from "@prisma/client";

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
