// 📁 app/link-account/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  const linkingUserId = url.searchParams.get("linkingUserId");

  // ตรวจสอบว่าข้อมูลครบไหม
  if (!provider || !linkingUserId) {
    return NextResponse.redirect(
      new URL("/admin/settings/profile?error=missing-params", req.url)
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/admin/settings/profile?error=no-session", req.url)
    );
  }

  const sessionUserId = session.user.id;

  // ❗ ถ้า session user คือคนที่เราจะผูกให้ (เช่น login LINE แล้วเจอ user Google เดิม) → ถือว่าผูกแล้ว
  if (sessionUserId === linkingUserId) {
    return NextResponse.redirect(
      new URL("/admin/settings/profile?success=already-linked", req.url)
    );
  }

  // ✋ ป้องกันการผูกซ้ำกับ user อื่นที่มี provider นี้อยู่แล้ว
  const alreadyLinked = await prisma.account.findFirst({
    where: {
      provider,
      NOT: {
        userId: sessionUserId, // มีบัญชี provider นี้ แต่ไม่ใช่เราที่ login
      },
    },
  });

  if (alreadyLinked) {
    return NextResponse.redirect(
      new URL("/admin/settings/profile?error=provider-already-linked", req.url)
    );
  }

  // ตรวจสอบว่า account ที่เพิ่ง login มานี้ มีจริงไหม
  const account = await prisma.account.findFirst({
    where: {
      provider,
      userId: sessionUserId,
    },
  });

  if (!account) {
    return NextResponse.redirect(
      new URL("/admin/settings/profile?error=account-not-found", req.url)
    );
  }

  // อัปเดต account นี้ให้ชี้ไปยัง user เดิม
  await prisma.account.update({
    where: { id: account.id },
    data: { userId: linkingUserId },
  });

  return NextResponse.redirect(
    new URL("/admin/settings/profile?success=linked", req.url)
  );
}
