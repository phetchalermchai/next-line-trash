import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettingByKey, getAllSettings, updateSetting } from "@/lib/settings/service";

// ✅ GET: ดึงค่า Setting ทั้งหมด หรือเฉพาะ key
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const key = searchParams.get("key");

  if (key) {
    const setting = await getSettingByKey(key);
    if (!setting) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }
    return NextResponse.json(setting);
  }

  const settings = await getAllSettings();
  return NextResponse.json(settings);
}

// ✅ PUT: อัปเดตค่า Setting (SUPERADMIN เท่านั้น)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { key, value } = body;

  if (!key || !value) {
    return NextResponse.json({ error: "Key และ Value จำเป็นต้องระบุ" }, { status: 400 });
  }

  const updated = await updateSetting(key, value);

  return NextResponse.json(updated);
}