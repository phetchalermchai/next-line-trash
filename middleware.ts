// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 🔒 ผู้ใช้ยังไม่ approved → ไป /pending-approval
    if (token.status !== "APPROVED") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }

    // 🔒 เข้าหน้า /admin ต้องเป็น ADMIN ขึ้นไป
    if (isAdminRoute && token.role !== "ADMIN" && token.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    const superadminOnlyPaths = [
      "/admin/users/dashboard",
      "/admin/users/manage",
      "/admin/users/approved",
      "/admin/users/banned",
    ];

    if (superadminOnlyPaths.some((path) => req.nextUrl.pathname.startsWith(path))) {
      if (token.role !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // ต้องมี token
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};