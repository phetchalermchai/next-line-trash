import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  try {
    const body = await req.json();

    // แยกกรณีเดี่ยวและหลายรายการ
    const items = Array.isArray(body) ? body : [body];

    const restoredItems = [];

    for (const item of items) {
      if (!item.createdAt || isNaN(new Date(item.createdAt).getTime())) {
        console.warn("Invalid createdAt, skipping item", item.id);
        continue;
      }

      const restored = await prisma.complaint.create({
        data: {
          id: item.id,
          lineUserId: item.lineUserId,
          source: item.source,
          reporterName: item.reporterName,
          receivedBy: item.receivedBy,
          phone: item.phone,
          description: item.description,
          message: item.message,
          status: item.status,
          location: item.location,
          imageBefore: item.imageBefore,
          imageAfter: item.imageAfter,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(),
        },
      });

      restoredItems.push(restored);
    }

    return NextResponse.json({ restored: restoredItems });
  } catch (error: any) {
    console.error("[UNDO DELETE] Error:", error);
    return NextResponse.json({ error: error.message || "Restore failed" }, { status: 500 });
  }
}
