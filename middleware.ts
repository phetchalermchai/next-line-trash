import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const url = req.nextUrl
  const isAdminRoute = url.pathname.startsWith("/admin")

  if (isAdminRoute) {
    // ✅ ไม่ได้ login
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // ✅ ถูก login แล้ว แต่ยังไม่อนุมัติ
    if (token.status === "PENDING") {
      return NextResponse.redirect(new URL("/auth/pending", req.url))
    }

    // ✅ login แล้วแต่ไม่ใช่ ADMIN หรือ SUPERADMIN
    if (token.role !== "ADMIN" && token.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/auth/unauthorized", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
