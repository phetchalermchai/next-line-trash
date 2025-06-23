import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function apiKeyAuth(req: NextRequest) {
  const headerKey = req.headers.get("x-api-key");
  if (!headerKey) {
    return NextResponse.json({ error: "API Key ไม่ถูกส่งมา" }, { status: 401 });
  }

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      key: headerKey,
      revokedAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }, // ยังไม่หมดอายุ
      ],
    },
  });

  if (!apiKey) {
    return NextResponse.json({ error: "API Key ไม่ถูกต้อง หรือถูกยกเลิก/หมดอายุแล้ว" }, { status: 403 });
  }

  return apiKey; // ✅ ส่งข้อมูล API Key กลับมาใช้งานต่อได้
}
