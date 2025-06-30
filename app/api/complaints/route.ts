import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { createComplaint } from "@/lib/complaint/service";
import { isValidComplaintStatus, isValidComplaintSource } from "@/lib/enum-utils";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { notifyGroupOnly, notifyUserAndGroup } from "@/lib/line/notify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await apiKeyAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { searchParams } = req.nextUrl;

  const search = searchParams.get("search") || undefined;
  const statusParam = searchParams.get("status");
  const sourceParam = searchParams.get("source");
  const status = isValidComplaintStatus(statusParam) ? statusParam : undefined;
  const source = isValidComplaintSource(sourceParam) ? sourceParam : undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const conditions: any[] = [];

  if (statusParam && !isValidComplaintStatus(statusParam)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (sourceParam && !isValidComplaintSource(sourceParam)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  if (search) {
    conditions.push({
      OR: [
        { description: { contains: search, mode: "insensitive" } },
        { reporterName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (status) conditions.push({ status });
  if (source) conditions.push({ source });
  if (startDate) conditions.push({ createdAt: { gte: new Date(startDate) } });
  if (endDate) conditions.push({ createdAt: { lte: new Date(endDate) } });

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [items, total] = await prisma.$transaction([
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);

  return NextResponse.json({
    items,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ ถ้ามี session และ role เป็น ADMIN หรือ SUPERADMIN ให้ผ่านได้ ไม่ต้องใช้ x-api-key
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      const authResult = await apiKeyAuth(req);
      if (authResult instanceof NextResponse) return authResult;
    }

    const formData = await req.formData();

    const source = formData.get("source")?.toString();
    const description = formData.get("description")?.toString();
    const lineUserId = formData.get("lineUserId")?.toString();
    const receivedBy = formData.get("receivedBy")?.toString();
    const reporterName = formData.get("reporterName")?.toString();
    const phone = formData.get("phone")?.toString();
    const location = formData.get("location")?.toString();
    const message = formData.get("message")?.toString();

    const imageFiles = formData.getAll("imageBeforeFiles") as File[];

    if (!source || !description) {
      return NextResponse.json({ error: "source และ description เป็นค่าบังคับ" }, { status: 400 });
    }

    if (source === "LINE") {
      if (!lineUserId) return NextResponse.json({ error: "LINE: ต้องมี lineUserId" }, { status: 400 });
      if (!imageFiles || imageFiles.length === 0)
        return NextResponse.json({ error: "LINE: ต้องแนบรูป" }, { status: 400 });
    } else {
      if (!receivedBy) return NextResponse.json({ error: "ต้องระบุ receivedBy" }, { status: 400 });
      if (!reporterName) return NextResponse.json({ error: "ต้องระบุ reporterName" }, { status: 400 });
    }

    let imageBeforeUrls: string[] = [];
    if (imageFiles && imageFiles.length > 0) {
      imageBeforeUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const filename = `complaint-${randomUUID()}.jpg`;
          return await uploadImageToSupabase(buffer, filename);
        })
      );
    }

    const complaint = await createComplaint({
      source: source as any,
      description,
      lineUserId,
      receivedBy,
      reporterName,
      phone,
      location,
      message,
      imageBefore: imageBeforeUrls.join(","),
    });

    console.log("[notify payload preview]", JSON.stringify(complaint, null, 2));

    if (source === "LINE") {
      await notifyUserAndGroup(complaint.id);
    } else {
      await notifyGroupOnly(complaint.id);
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("[POST /api/complaints] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
