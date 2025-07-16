import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import LineProvider from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      email?: string | null;
      name?: string | null;
    };
  }

  interface User {
    role: Role;
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
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
      clientId: process.env.LINE_CLIENT_ID!, // = Channel ID
      clientSecret: process.env.LINE_CLIENT_SECRET!, // = Channel secret
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.provider || !account?.providerAccountId) {
        return false;
      }

      // ✅ กรณี user ไม่มี email → fallback หาจาก account แทน
      let existingUser = null;

      if (user.email) {
        existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
      } else {
        const accountLink = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });
        if (accountLink) {
          existingUser = await prisma.user.findUnique({
            where: { id: accountLink.userId },
          });
        }
      }

      // ถ้ามี user เดิม → ผูก account นี้กับ user เดิม
      if (existingUser) {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              userId: existingUser.id,
              type: account.type ?? "oauth",
            },
          });
        }

        return true;
      }

      // ✅ user ใหม่ → ให้ NextAuth สร้างให้
      return true;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { id: true, name: true, email: true, role: true, status: true },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
          session.user.role = dbUser.role;
          session.user.status = dbUser.status;
        }
      }

      return session;
    },
    async jwt({ token, user }) {
      // เมื่อมี user (login ครั้งแรก)
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      } else {
        // fallback: กรณี refresh token หรือ session reload
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      }

      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
