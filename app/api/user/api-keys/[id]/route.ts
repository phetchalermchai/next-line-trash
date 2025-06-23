import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const { id } = await params
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = await prisma.apiKey.findUnique({
        where: { id: id },
    });

    if (!apiKey || apiKey.userId !== session.user.id) {
        return NextResponse.json({ error: "API Key ไม่ถูกต้องหรือไม่มีสิทธิ์" }, { status: 403 });
    }

    if (apiKey.revokedAt) {
        return NextResponse.json({ error: "API Key นี้ถูกยกเลิกไปแล้ว" }, { status: 400 });
    }

    await prisma.apiKey.update({
        where: { id: id },
        data: {
            revokedAt: new Date(),
        },
    });

    return NextResponse.json({ message: "ยกเลิก API Key เรียบร้อยแล้ว" });
}
