"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="Login-wrapper">
        {children}
      </div>
    </SessionProvider>
  );
}