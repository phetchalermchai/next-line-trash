import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { apiKeyAuth } from "@/lib/middleware/api-key-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await apiKeyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  return NextResponse.json(complaint);
}
