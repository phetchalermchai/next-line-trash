import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "../theme-toggle";

export function SiteHeader() {
    const pathname = usePathname();

    // Static path to title map
    const staticPages: { path: string; title: string }[] = [
        { path: "/admin/complaints/dashboard", title: "แดชบอร์ดเรื่องร้องเรียน" },
        { path: "/admin/complaints/manage", title: "จัดการเรื่องร้องเรียน" },
        { path: "/admin/complaints/create", title: "สร้างเรื่องร้องเรียน" },
        { path: "/admin/users/dashboard", title: "แดชบอร์ดผู้ใช้งาน" },
        { path: "/admin/users/pending", title: "อนุมัติผู้ใช้งาน" },
        { path: "/admin/users/manage", title: "จัดการผู้ใช้งาน" },
        { path: "/admin/users/approved", title: "ผู้ใช้งานที่อนุมัติแล้ว" },
        { path: "/admin/users/banned", title: "ผู้ใช้งานที่ถูกระงับ" },
        { path: "/admin/assistant", title: "ตัวช่วยจัดทำเอกสาร" },
        { path: "/admin/settings/profile", title: "ตั้งค่าบัญชีผู้ใช้งาน" },
        { path: "/admin/settings/bot&notification", title: "ตั้งค่าการแจ้งเตือน (Bot)" },
        { path: "/admin/settings/bot/groupid-log", title: "Log Group ID" },
        { path: "/admin/settings/zones", title: "ตั้งค่าพื้นที่โซน" },
    ];

    // Dynamic matcher logic
    let pageTitle = "หน้าอื่นๆ";

    for (const page of staticPages) {
        if (pathname === page.path || pathname.startsWith(page.path + "/")) {
            pageTitle = page.title;
            break;
        }
    }

    if (/^\/admin\/complaints\/.+\/edit$/.test(pathname)) {
        const id = pathname.split("/")[3]?.slice(-6).toUpperCase() || "...";
        pageTitle = `แก้ไขเรื่องร้องเรียน #${id}`;
    } else if (/^\/admin\/complaints\/.+\/report$/.test(pathname)) {
        const id = pathname.split("/")[3]?.slice(-6).toUpperCase() || "...";
        pageTitle = `รายงานผลการดำเนินงาน #${id}`;
    }

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-base font-medium">{pageTitle}</h1>
                <div className="ml-auto flex items-center gap-2">
                    <ModeToggle />
                </div>
            </div>
        </header>
    )
}
