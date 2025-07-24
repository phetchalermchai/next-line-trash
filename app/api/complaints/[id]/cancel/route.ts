import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/complaints/[id]/cancel
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Parse JSON body
    let body: any = {};
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    const userId = body.userId;

    // Basic validation
    if (!id || typeof id !== "string") {
        return NextResponse.json({ message: "รหัสไม่ถูกต้อง" }, { status: 400 });
    }
    if (!userId || typeof userId !== "string") {
        return NextResponse.json({ message: "userId ไม่ถูกต้อง" }, { status: 400 });
    }

    // Find complaint
    const complaint = await prisma.complaint.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
            source: true,
            lineUserId: true,
        }
    });

    if (!complaint) {
        return NextResponse.json({ message: "ไม่พบเรื่องร้องเรียน" }, { status: 404 });
    }
    if (complaint.status !== "PENDING") {
        return NextResponse.json({ message: "ยกเลิกได้เฉพาะเรื่องที่รอดำเนินการ" }, { status: 400 });
    }
    if (complaint.source !== "LINE") {
        return NextResponse.json({ message: "เรื่องร้องเรียนนี้ไม่ได้มาจาก LINE" }, { status: 400 });
    }
    if (complaint.lineUserId !== userId) {
        return NextResponse.json({ message: "คุณไม่มีสิทธิ์ยกเลิกเรื่องนี้" }, { status: 403 });
    }

    // อัปเดตสถานะเป็น CANCELLED
    await prisma.complaint.update({
        where: { id },
        data: {
            status: "CANCELLED",
            updatedAt: new Date(),
            // cancelledAt: new Date(), // เพิ่มเองถ้ามี field นี้
        },
    });

    // แจ้งเตือน LINE หรือ log อื่นๆ เพิ่มตรงนี้ได้

    return NextResponse.json({ message: "ยกเลิกสำเร็จ" });
}
