// 📁 app/api/user/unlink-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json();

  // ป้องกันถอด provider สุดท้ายออกหมด
  const linkedAccounts = await prisma.account.findMany({
    where: { userId: session.user.id },
  });

  if (linkedAccounts.length <= 1) {
    return NextResponse.json({ error: "Cannot unlink last account" }, { status: 400 });
  }

  await prisma.account.deleteMany({
    where: {
      provider,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}