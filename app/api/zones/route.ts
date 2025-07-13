import { authOptions } from '@/lib/auth';
import { apiKeyAuth } from '@/lib/middleware/api-key-auth';
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ ถ้ามี session และ role เป็น ADMIN หรือ SUPERADMIN ให้ผ่านได้ ไม่ต้องใช้ x-api-key
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      // ถ้าไม่มี session → ใช้ apiKeyAuth ตรวจสอบ
      const authResult = await apiKeyAuth(req);
      if (authResult instanceof NextResponse) return authResult;
    }
    const zones = await prisma.zone.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(zones)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error fetching zones' }, { status: 500 })
  }
}

function closePolygonIfNeeded(points: number[][]): number[][] {
  if (points.length < 3) return points
  const first = points[0]
  const last = points[points.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...points, first]
  }
  return points
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ ถ้ามี session และ role เป็น ADMIN หรือ SUPERADMIN ให้ผ่านได้ ไม่ต้องใช้ x-api-key
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      // ถ้าไม่มี session → ใช้ apiKeyAuth ตรวจสอบ
      const authResult = await apiKeyAuth(req);
      if (authResult instanceof NextResponse) return authResult;
    }
    const data = await req.json()

    if (typeof data.name !== "string" || !data.name.trim()) {
      return NextResponse.json({ message: "ต้องระบุชื่อโซน (name) เป็น string และห้ามว่าง" }, { status: 400 });
    }

    if (
      !Array.isArray(data.polygon) ||
      data.polygon.length < 3 ||
      !data.polygon.every(
        (point: any) =>
          Array.isArray(point) &&
          point.length === 2 &&
          typeof point[0] === "number" &&
          typeof point[1] === "number"
      )
    ) {
      return NextResponse.json({ message: "polygon ต้องเป็น array [lat, lng] อย่างน้อย 3 จุด" }, { status: 400 });
    }
    if (data.lineGroupId && typeof data.lineGroupId !== "string") {
      return NextResponse.json({ message: "LINE Group ID ต้องเป็น string" }, { status: 400 });
    }
    if (data.telegramGroupId && typeof data.telegramGroupId !== "string") {
      return NextResponse.json({ message: "Telegram Group ID ต้องเป็น string" }, { status: 400 });
    }

    const closedPolygon = closePolygonIfNeeded(data.polygon)

    const zone = await prisma.zone.create({
      data: {
        name: data.name.trim(),
        lineGroupId: data.lineGroupId,
        telegramGroupId: data.telegramGroupId,
        polygon: closedPolygon,
      },
    })
    return NextResponse.json(zone)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error creating zone' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ ถ้ามี session และ role เป็น ADMIN หรือ SUPERADMIN ให้ผ่านได้ ไม่ต้องใช้ x-api-key
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      // ถ้าไม่มี session → ใช้ apiKeyAuth ตรวจสอบ
      const authResult = await apiKeyAuth(req);
      if (authResult instanceof NextResponse) return authResult;
    }
    const { ids } = await req.json()

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => typeof id !== "string" || !id)
    ) {
      return NextResponse.json({ message: "ids ต้องเป็น array ของ string (และห้ามว่าง)" }, { status: 400 });
    }

    await prisma.zone.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Error deleting zones' }, { status: 500 })
  }
}