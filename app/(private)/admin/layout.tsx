"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/navbar/app-sidebar";
import { SiteHeader } from "@/components/navbar/site-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SidebarProvider style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 md:gap-6 ">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}