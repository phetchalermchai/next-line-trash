import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";
import { notifyManualLineGroupReminder } from "@/lib/line/notify";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    const authResult = await apiKeyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
  }

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

    await notifyManualLineGroupReminder(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[NOTIFY GROUP] Error:", error);
    return NextResponse.json({ error: error.message || "Notify failed" }, { status: 500 });
  }
}
