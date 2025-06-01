import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SignJWT } from 'jose';

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
    token?: any;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          // return พร้อม role
          return { id: "admin", name: "Admin User", role: "admin" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // เพิ่ม role ลง token
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // ดึง role กลับมาใน session
      session.user.role = typeof token.role === "string" ? token.role : undefined;
      const secret = process.env.NEXTAUTH_SECRET!;
      const encodedSecret = new TextEncoder().encode(secret);

      const jwt = await new SignJWT(token as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(encodedSecret);

      session.token = jwt;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
