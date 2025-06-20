import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import LineProvider from "next-auth/providers/line"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      status?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
    accessToken?: string;
  }
  interface User {
    id?: string;
    role?: string;
    status?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      const base = process.env.NEXT_PUBLIC_API_COMPLAINTS;
      const isBrowser = typeof window !== "undefined";
      if (account && profile) {
        const providerAccountId = (profile as any).sub || (profile as any).id;

        // 👇 ดึง userId จาก sessionStorage (ถ้ามี)
        let currentUserId = token.id;
        if (isBrowser && !currentUserId) {
          currentUserId = sessionStorage.getItem("linkingUserId") || undefined;
          sessionStorage.removeItem("linkingUserId"); // clear ทันที
        }

        const res = await fetch(`${base}/auth/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            provider: account.provider,
            currentUserId,
          }),
        });

        const data = await res.json();
        token.id = data.id;
        token.role = data.role;
        token.status = data.status;
        token.accessToken = data.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : undefined;
        session.user.role = typeof token.role === "string" ? token.role : undefined;
        session.user.status = typeof token.status === "string" ? token.status : undefined;
      }

      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};