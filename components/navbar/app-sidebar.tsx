import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    GaugeCircle,
    Search,
    FileBarChart2,
    FileText,
    Settings,
    LogOut,
    User2,
    ShieldAlert,
    UserCheck,
    Users,
    UserX,
    UserCheck2,
    BarChart3,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import clsx from "clsx";

const applicationMenu = [
    { title: "แดชบอร์ด", href: "/admin/dashboard", icon: GaugeCircle },
    { title: "ค้นหาร้องเรียนย้อนหลัง", href: "/admin/complaints", icon: Search },
];

const documentMenu = [
    { title: "รายงาน (Reports)", href: "/admin/report", icon: FileBarChart2 },
    { title: "ร่างเอกสาร/หนังสือราชการ", href: "/admin/doc", icon: FileText },
];

const usersMenu = [
    { title: "แดชบอร์ดผู้ใช้งาน", href: "/admin/users/dashboard", icon: BarChart3 },
    { title: "อนุมัติผู้ใช้งาน", href: "/admin/users/pending", icon: UserCheck },
    { title: "ผู้ใช้งานที่อนุมัติแล้ว", href: "/admin/users/approved", icon: UserCheck2 },
    { title: "จัดการผู้ใช้งาน", href: "/admin/users/manage", icon: Users },
    { title: "ผู้ใช้งานที่ถูกระงับ", href: "/admin/users/banned", icon: UserX },
];

const settingsMenu = [
    { title: "ตั้งค่าบัญชีผู้ใช้", href: "/admin/settings/profile", icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const isSuperadmin = session?.user?.role === "SUPERADMIN";

    const isPathMatch = (menuHref: string) => {
        // Exact match or subpath for dynamic route
        return (
            pathname === menuHref ||
            pathname.startsWith(menuHref + "/") ||
            (menuHref === "/admin/complaints" &&
                /^\/admin\/complaints\/.+\/(edit|report)$/.test(pathname))
        );
    };

    if (status === "loading") {
        return (
            <Sidebar variant="inset">
                <div className="flex items-center gap-3 px-4 py-4 border-b">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </div>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className="px-4 py-2">
                            <Skeleton className="h-4 w-32" />
                        </SidebarGroupLabel>
                        <SidebarGroupContent className="space-y-1 px-2">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full rounded-md" />
                            ))}
                        </SidebarGroupContent>

                        <SidebarGroupLabel className="px-4 py-2">
                            <Skeleton className="h-4 w-24" />
                        </SidebarGroupLabel>
                        <SidebarGroupContent className="space-y-1 px-2">
                            {[...Array(2)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full rounded-md" />
                            ))}
                        </SidebarGroupContent>

                        <SidebarGroupLabel className="px-4 py-2">
                            <Skeleton className="h-4 w-28" />
                        </SidebarGroupLabel>
                        <SidebarGroupContent className="space-y-1 px-2">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full rounded-md" />
                            ))}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="border-t p-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="w-4 h-4 rounded-md" />
                </SidebarFooter>
            </Sidebar>
        );
    }

    const renderMenu = (menu: typeof applicationMenu) => (
        <SidebarMenu>
            {menu.map((item, key) => {
                const isActive = isPathMatch(item.href);
                return (
                    <SidebarMenuItem key={key}>
                        <SidebarMenuButton asChild>
                            <Link
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-accent/60 text-muted-foreground"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );

    return (
        <Sidebar variant="inset">
            <div className="flex items-center gap-3 px-4 py-4 border-b">
                <ShieldAlert className="w-6 h-6 text-primary" />
                <h1 className="text-lg font-semibold tracking-tight text-primary">
                    Complaint Admin
                </h1>
            </div>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4 py-2">
                        ระบบจัดการร้องเรียน
                    </SidebarGroupLabel>
                    <SidebarGroupContent>{renderMenu(applicationMenu)}</SidebarGroupContent>

                    <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4 py-2">
                        รายงานและเอกสาร
                    </SidebarGroupLabel>
                    <SidebarGroupContent>{renderMenu(documentMenu)}</SidebarGroupContent>

                    {isSuperadmin && (
                        <>
                            <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4 py-2">
                                ระบบจัดการผู้ใช้งาน
                            </SidebarGroupLabel>
                            <SidebarGroupContent>{renderMenu(usersMenu)}</SidebarGroupContent>
                        </>
                    )}

                    <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4 py-2">
                        การตั้งค่า
                    </SidebarGroupLabel>
                    <SidebarGroupContent>{renderMenu(settingsMenu)}</SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4 flex items-center gap-3 text-sm text-muted-foreground">
                <User2 className="w-5 h-5" />
                <div className="flex-1">
                    <p className="font-medium text-foreground">
                        {session?.user?.name || "ไม่ทราบชื่อ"}
                    </p>
                    <p className="text-xs">
                        {session?.user?.email || "-"}
                    </p>
                </div>
                <LogOut
                    className="w-4 h-4 cursor-pointer hover:text-destructive"
                    onClick={() => signOut()}
                />
            </SidebarFooter>
        </Sidebar>
    );
}
