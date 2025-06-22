import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    // 🔒 ตรวจ role และ status อย่างปลอดภัย
    if (
      req.nextUrl.pathname.startsWith("/admin") &&
      (token?.role !== "ADMIN" || token?.status !== "APPROVED")
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // ต้องมี token ถึงจะเข้าผ่าน
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
