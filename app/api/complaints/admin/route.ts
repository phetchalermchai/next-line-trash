import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { notifyGroupOnly } from "@/lib/line/notify";
import { NextRequest, NextResponse } from "next/server";
import { createComplaint } from "@/lib/complaint/service";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { ComplaintSource } from "@prisma/client";
import { uploadImageToSupabase } from "@/lib/storage/upload-image";
import { randomUUID } from "crypto";

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

        const complaint = await createComplaint({
            source,
            description,
            receivedBy,
            reporterName,
            phone,
            location,
            imageBefore: imageBeforeUrls.join(","),
        });

        await notifyGroupOnly(complaint.id);

        return NextResponse.json(complaint);
    } catch (error) {
        console.error("[POST /api/complaints/admin] Error:", error);
        const errorMessage = (error instanceof Error) ? error.message : "Internal server error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}