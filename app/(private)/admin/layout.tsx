"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="admin-wrapper">
        {children}
      </div>
    </SessionProvider>
  );
}