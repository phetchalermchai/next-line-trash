import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keys);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { name } = data;

    if (!name || typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "กรุณาระบุชื่อ API Key" }, { status: 400 });
    }

    const existing = await prisma.apiKey.count({
        where: {
            userId: session.user.id,
            revokedAt: null,
        },
    });

    if (existing >= 5) {
        return NextResponse.json(
            { error: "คุณมี API Key ครบจำนวนสูงสุดแล้ว (5 ชุด)" },
            { status: 400 }
        );
    }

    const rawKey = randomBytes(32).toString("hex");
    const hashedKey = createHash("sha256").update(rawKey).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 วัน

    const newKey = await prisma.apiKey.create({
        data: {
            name: name.trim(),
            key: hashedKey,
            userId: session.user.id,
            expiresAt,
        },
    });

    return NextResponse.json({
        message: "สร้าง API Key สำเร็จ",
        key: rawKey, // โชว์เฉพาะตอนสร้างเท่านั้น
        expiresAt,
    });
}
