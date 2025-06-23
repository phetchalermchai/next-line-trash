import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "../theme-toggle";

export function SiteHeader() {
    const pathname = usePathname();

    // Static path to title map
    const staticPages: { path: string; title: string }[] = [
        { path: "/admin/dashboard", title: "แดชบอร์ดเรื่องร้องเรียน" },
        { path: "/admin/complaints", title: "ค้นหาร้องเรียนย้อนหลัง" },
        { path: "/admin/reports", title: "รายงาน" },
        { path: "/admin/assistant", title: "ตัวช่วยจัดทำเอกสาร" },
        { path: "/admin/settings/profile", title: "ตั้งค่าบัญชีผู้ใช้งาน" },
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
    } else if (/^\/admin\/complaints\/create/.test(pathname)) {
        pageTitle = `สร้างรายการร้องเรียนโดยเจ้าหน้าที่`;
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
