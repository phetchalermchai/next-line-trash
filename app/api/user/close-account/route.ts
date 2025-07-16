import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        if (session.user.role === "SUPERADMIN") {
            return NextResponse.json({ error: "SUPERADMIN ไม่สามารถปิดบัญชีตัวเองได้" }, { status: 400 });
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: { status: "BANNED" },
        });

        return NextResponse.json({ success: true, user });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
