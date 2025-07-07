import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  const formData = await req.formData();
  const message = formData.get("message")?.toString() || "";
  const imageAfterFiles = formData.getAll("imageAfterFiles") as File[];

  if (!message.trim()) {
    return NextResponse.json({ error: "กรุณากรอกสรุปผล" }, { status: 400 });
  }

  try {
    const found = await prisma.complaint.findUnique({ where: { id } });
    if (!found) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    const uploadedUrls: string[] = [];
    for (const file of imageAfterFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `after-${id}-${Date.now()}-${file.name}`;
      const url = await uploadImageToSupabase(buffer, filename);
      uploadedUrls.push(url);
    }

    const updateData: any = {
      message,
      status: "DONE",
      updatedAt: new Date(),
    };

    if (uploadedUrls.length > 0) {
      updateData.imageAfter = [...(found.imageAfter?.split(",") || []), ...uploadedUrls].join(",");
    }

    const updated = await prisma.complaint.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[REPORT Complaint] Error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}