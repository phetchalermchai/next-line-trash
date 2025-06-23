import { NextRequest, NextResponse } from "next/server";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";

export async function GET(req: NextRequest) {
  const result = await apiKeyAuth(req);
  if (result instanceof NextResponse) return result; // มี error -> คืน response error ทันที

  // ✅ ผ่านแล้ว
  return NextResponse.json({
    message: "เรียกข้อมูลสำเร็จ",
    from: "API ที่ป้องกันด้วย API Key",
  });
}
