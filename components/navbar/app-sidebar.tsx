import { usePathname } from "next/navigation";
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
import clsx from "clsx";

const applicationMenu = [
    { title: "แดชบอร์ด", href: "/admin/dashboard", icon: GaugeCircle },
    { title: "ค้นหาร้องเรียนย้อนหลัง", href: "/admin/complaints", icon: Search },
];

const documentMenu = [
    { title: "รายงาน (Reports)", href: "/admin/report", icon: FileBarChart2 },
    { title: "ร่างเอกสาร/หนังสือราชการ", href: "/admin/doc", icon: FileText },
];

const settingsMenu = [
    { title: "ตั้งค่าบัญชีผู้ใช้", href: "/admin/settings/profile", icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();

    const isPathMatch = (menuHref: string) => {
        // Exact match or subpath for dynamic route
        return (
            pathname === menuHref ||
            pathname.startsWith(menuHref + "/") ||
            (menuHref === "/admin/complaints" &&
                /^\/admin\/complaints\/.+\/(edit|report)$/.test(pathname))
        );
    };

    const renderMenu = (items: typeof applicationMenu) => (
        <SidebarMenu>
            {items.map((item, key) => {
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

                    <SidebarGroupLabel className="text-xs uppercase text-muted-foreground px-4 py-2">
                        การตั้งค่า
                    </SidebarGroupLabel>
                    <SidebarGroupContent>{renderMenu(settingsMenu)}</SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4 flex items-center gap-3 text-sm text-muted-foreground">
                <User2 className="w-5 h-5" />
                <div className="flex-1">
                    <p className="font-medium text-foreground">shadcn</p>
                    <p className="text-xs">me@example.com</p>
                </div>
                <LogOut className="w-4 h-4 cursor-pointer hover:text-destructive" />
            </SidebarFooter>
        </Sidebar>
    );
}
