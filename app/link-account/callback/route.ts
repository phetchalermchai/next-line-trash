// 📁 app/link-account/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  const linkingUserId = url.searchParams.get("linkingUserId");

  if (!provider || !linkingUserId) {
    return NextResponse.redirect(new URL("/admin/settings/link-account?error=missing-params", req.url));
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/admin/settings/link-account?error=no-session", req.url));
  }

  const sessionUserId = session.user.id;
  if (sessionUserId === linkingUserId) {
    return NextResponse.redirect(new URL("/admin/settings/link-account?success=already-linked", req.url));
  }

  const account = await prisma.account.findFirst({
    where: {
      provider,
      userId: sessionUserId,
    },
  });

  if (!account) {
    return NextResponse.redirect(new URL("/admin/settings/link-account?error=account-not-found", req.url));
  }

  if (account.userId !== sessionUserId) {
    return NextResponse.redirect(new URL("/admin/settings/link-account?error=already-linked-to-other-user", req.url));
  }

  await prisma.account.update({
    where: { id: account.id },
    data: { userId: linkingUserId },
  });

  return NextResponse.redirect(new URL("/admin/settings/link-account?success=linked", req.url));
}
