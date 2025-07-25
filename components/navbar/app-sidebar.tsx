import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GaugeCircle, Search, FileBarChart2, FileText, Settings, LogOut, User2, ShieldAlert, UserCheck, Users, UserX, UserCheck2, BarChart3, MapPinned, Bot, Group } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import clsx from "clsx";

const applicationMenu = [
    { title: "แดชบอร์ด", href: "/admin/complaints/dashboard", icon: GaugeCircle },
    { title: "จัดการเรื่องร้องเรียน", href: "/admin/complaints/manage", icon: Search },
    { title: "สร้างเรื่องร้องเรียน", href: "/admin/complaints/create", icon: Search },
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

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const isSuperadmin = session?.user?.role === "SUPERADMIN";

    const isPathMatch = (menuHref: string) => {
        return (
            pathname === menuHref ||
            pathname.startsWith(menuHref + "/") ||
            (menuHref === "/admin/complaints" &&
                /^\/admin\/complaints\/.+\/(edit|report)$/.test(pathname))
        );
    };

    const finalSettingsMenu = [
        { title: "ตั้งค่าบัญชีผู้ใช้", href: "/admin/settings/profile", icon: Settings },
        ...(isSuperadmin ? [
            { title: "ตั้งค่าการแจ้งเตือน (Bot)", href: "/admin/settings/bot&notification", icon: Bot },
            { title: "Log Group ID", href: "/admin/settings/bot/groupid-log", icon: Group },
            { title: "ตั้งค่าพื้นที่โซน", href: "/admin/settings/zones", icon: MapPinned }
        ] : []),
    ];

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

                    <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4 py-2">การตั้งค่า</SidebarGroupLabel>
                    <SidebarGroupContent>{renderMenu(finalSettingsMenu)}</SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4 flex items-center gap-3 text-sm text-muted-foreground">
                <Avatar className="w-5 h-5">
                    <AvatarImage src={session?.user.image as string} alt={session?.user.email || ""} />
                    <AvatarFallback>{session?.user.name?.slice(0, 1) as string}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-medium text-foreground text-center">{session?.user?.name || "ไม่ทราบชื่อ"}</p>
                    <p className="text-xs text-center">{session?.user?.email || "-"}</p>
                </div>
                <LogOut
                    className="w-4 h-4 cursor-pointer hover:text-destructive"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                />
            </SidebarFooter>
        </Sidebar>
    );
}
