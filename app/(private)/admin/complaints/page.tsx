"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/complaint/DatePickerWithRange";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import api from "@/lib/axios";
import { CheckCircle, Trash2, Pencil, Bell, Eye, FileDown, FileText, ClipboardCheck, MoreVertical, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCcw, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import debounce from "lodash.debounce";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font as sarabunFont } from "@/utils/fonts/Sarabun-normal";
import { getExportFilename } from "@/utils/getExportFilename";
import { Complaint } from "@/types/complaint";

// Extend jsPDFAPI to include __sarabunFontLoaded
declare module "jspdf" {
    interface jsPDFAPI {
        __sarabunFontLoaded?: boolean;
    }
}

if (!jsPDF.API.__sarabunFontLoaded) {
    jsPDF.API.__sarabunFontLoaded = true; // ป้องกัน push ซ้ำตอน HMR
    jsPDF.API.events.push([
        "addFonts",
        function (this: jsPDF) {
            this.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
            this.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
        },
    ]);
}

const statusMap = {
    PENDING: {
        label: "รอดำเนินการ",
        icon: <Clock className="w-4 h-4 text-yellow-500" />,
        color: "text-yellow-600 bg-yellow-50",
    },
    DONE: {
        label: "เสร็จสิ้น",
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        color: "text-green-600 bg-green-50",
    },
};

const sourceMap = {
    LINE: { label: "LINE" },
    FACEBOOK: { label: "Facebook" },
    PHONE: { label: "PHONE" },
    COUNTER: { label: "COUNTER" },
    OTHER: { label: "OTHER" },
};

export default function ComplaintSearchPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [source, setSource] = useState("ALL");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingNotifyId, setLoadingNotifyId] = useState<string | null>(null);
    const [confirmDialogId, setConfirmDialogId] = useState<string | null>(null);
    const [loadingExportPDF, setLoadingExportPDF] = useState(false);
    const [loadingExportExcel, setLoadingExportExcel] = useState(false);
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    const fetchData = async (overrideSearch?: string) => {
        const params = new URLSearchParams();
        const keyword = overrideSearch ?? search;
        if (keyword) params.append("search", keyword);
        if (status !== "ALL") params.append("status", status);
        if (source !== "ALL") params.append("source", source);
        if (dateRange?.from) {
            const start = new Date(dateRange.from);
            start.setHours(0, 0, 0, 0);
            params.append("startDate", start.toISOString());
        }
        if (dateRange?.to) {
            const end = new Date(dateRange.to);
            end.setHours(23, 59, 59, 999);
            params.append("endDate", end.toISOString());
        }
        params.append("page", String(page));
        params.append("limit", String(limit));
        try {
            const res = await api.get(`/complaints?${params.toString()}`);
            setComplaints(res.data.items);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("โหลดข้อมูลร้องเรียนล้มเหลว", err);
        }
    };

    const fetchAllData = async () => {
        const allItems: Complaint[] = [];
        let currentPage = 1;
        while (true) {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (status !== "ALL") params.append("status", status);
            if (source !== "ALL") params.append("source", source);
            if (dateRange?.from) {
                const start = new Date(dateRange.from);
                start.setHours(0, 0, 0, 0);
                params.append("startDate", start.toISOString());
            }
            if (dateRange?.to) {
                const end = new Date(dateRange.to);
                end.setHours(23, 59, 59, 999);
                params.append("endDate", end.toISOString());
            }
            params.append("page", String(currentPage));
            params.append("limit", String(limit));

            const res = await api.get(`/complaints?${params.toString()}`);
            allItems.push(...res.data.items);

            if (currentPage >= res.data.totalPages) break;
            currentPage++;
        }
        return allItems;
    };

    const filterSelected = (items: Complaint[]) => {
        return selectedIds.length === 0 ? items : items.filter(c => selectedIds.includes(c.id));
    };

    useEffect(() => {
        fetchData();
    }, [page, status, dateRange]);

    const debouncedSearch = useMemo(
        () => debounce((val: string) => { setPage(1); fetchData(val); }, 500),
        []
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handleDelete = async (id: string) => {
        const itemToDelete = complaints.find((c) => c.id === id);
        if (!itemToDelete) return;
        try {
            await api.delete(`/complaints/${id}`);
            toast.success("ลบสำเร็จ", {
                description: "รูปภาพจะไม่สามารถเรียกคืนได้",
                action: {
                    label: "เลิกทำ",
                    onClick: async () => {
                        try {
                            await api.post("/complaints/undo-delete", itemToDelete);
                            toast.success("เรียกคืนรายการสำเร็จ");
                            fetchData();
                        } catch (err) {
                            toast.error("ไม่สามารถ เลิกทำ ได้");
                        }
                    },
                },
            });
            fetchData();
        } catch (err) {
            toast.error("เกิดข้อผิดพลาดในการลบ");
            console.error("ลบไม่สำเร็จ", err);
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        const deletedItems = complaints.filter((c) => selectedIds.includes(c.id));
        try {
            await api.post(`/complaints/bulk`, {
                ids: selectedIds,
            });

            toast.success(`ลบ ${selectedIds.length} รายการเรียบร้อยแล้ว`, {
                description: "รูปภาพจะไม่สามารถเรียกคืนได้",
                action: {
                    label: "เลิกทำ",
                    onClick: async () => {
                        try {
                            for (const item of deletedItems) {
                                await api.post("/complaints/undo-delete", item);
                            }
                            toast.success("เรียกคืนข้อมูลสำเร็จ");
                            await fetchData();
                        } catch (err) {
                            toast.error("ไม่สามารถ เลิกทำ ได้");
                        }
                    },
                },
            });
            setSelectedIds([]);
            await fetchData();
        } catch (err) {
            console.error("เกิดข้อผิดพลาดในการลบหลายรายการ", err);
            toast.error("เกิดข้อผิดพลาดในการลบรายการที่เลือก");
        }
    };

    const handleNotifyLine = async (complaint: Complaint) => {
        const created = new Date(complaint.createdAt);
        const now = new Date();
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

        const lastNotified = complaint.notifiedAt ? new Date(complaint.notifiedAt) : null;
        const notifiedDiff = lastNotified
            ? (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24)
            : Infinity;

        if (diffDays < 1) {
            toast.error("สามารถแจ้งเตือนได้หลังจากบันทึกอย่างน้อย 1 วัน");
            return;
        }
        if (notifiedDiff < 1) {
            toast.error("แจ้งเตือนไปแล้วในวันนี้");
            return;
        }
        setConfirmDialogId(complaint.id);
    };

    const confirmNotifyLine = async (complaint: Complaint) => {
        setConfirmDialogId(null);
        setLoadingNotifyId(complaint.id);
        try {
            await api.put(`/webhook/line/${complaint.id}/notify-group`);
            toast.success("แจ้งเตือนไปยังกลุ่มไลน์แล้ว");
            await fetchData();
        } catch (err) {
            console.error("แจ้งเตือนไม่สำเร็จ", err);
            toast.error("ไม่สามารถแจ้งเตือนได้");
        } finally {
            setLoadingNotifyId(null);
        }
    };

    const exportExcel = async () => {
        setLoadingExportExcel(true);
        try {
            const allComplaints = filterSelected(await fetchAllData());
            const header = [
                ["รายงานข้อมูลเรื่องร้องเรียน"],
                [`สถานะ: ${status === "ALL" ? "ทั้งหมด" : statusMap[status as keyof typeof statusMap]?.label}`],
                [dateRange?.from && dateRange?.to
                    ? `ช่วงวันที่: ${format(dateRange.from, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())} - ${format(dateRange.to, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}`
                    : ""],
                []
            ];
            const mapped = allComplaints.map(c => ({
                "ผู้แจ้ง": c.reporterName || "",
                "ผู้รับแจ้ง": c.receivedBy || "",
                "เบอร์โทร": c.phone || "",
                "รายละเอียด": c.description,
                "ช่องทาง": c.source,
                "พิกัด": c.location || "",
                "สถานะ": c.status,
                "สรุปผล": c.message || "",
                "วันที่บันทึก": format(new Date(c.createdAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString()),
                "วันที่อัพเดท": format(new Date(c.updatedAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())
            }));
            const worksheet = XLSX.utils.json_to_sheet([]);
            XLSX.utils.sheet_add_aoa(worksheet, header, { origin: 0 });
            XLSX.utils.sheet_add_json(worksheet, mapped, { origin: -1 });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const data = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(data, getExportFilename("excel", status, dateRange));
            toast.success("ส่งออก Excel สำเร็จ");
        } catch (error) {
            toast.error("ส่งออก Excel ไม่สำเร็จ");
        } finally {
            setLoadingExportExcel(false);
        }
    };

    const exportPDF = async () => {
        setLoadingExportPDF(true);
        try {
            const allComplaints = filterSelected(await fetchAllData());
            const doc = new jsPDF({ orientation: "landscape" });
            doc.setFont("Sarabun");
            doc.setFontSize(10);
            doc.text("รายงานข้อมูลเรื่องร้องเรียน", 14, 10);
            doc.text(`สถานะ: ${status === "ALL" ? "ทั้งหมด" : statusMap[status as keyof typeof statusMap]?.label}`, 14, 16);
            if (dateRange?.from && dateRange?.to) {
                doc.text(`ช่วงวันที่: ${format(dateRange.from, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())} - ${format(dateRange.to, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}`, 14, 22);
            }
            autoTable(doc, {
                startY: 28,
                head: [[
                    "ผู้แจ้ง", "ผู้รับแจ้ง", "เบอร์โทร", "รายละเอียด", "ช่องทาง",
                    "สถานะ", "สรุปผล", "วันที่บันทึก", "วันที่อัพเดท"
                ]],
                body: allComplaints.map(c => [
                    String(c.reporterName || ""),
                    String(c.receivedBy || ""),
                    String(c.phone || ""),
                    String(c.description),
                    String(c.source),
                    String(c.status),
                    String(c.message || ""),
                    format(new Date(c.createdAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString()),
                    format(new Date(c.updatedAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())
                ]),
                styles: {
                    font: "Sarabun",
                    fontStyle: "normal",
                    fontSize: 10,
                },
                headStyles: {
                    font: "Sarabun",
                    fontStyle: "normal",
                    fontSize: 10,
                },
                bodyStyles: {
                    font: "Sarabun",
                    fontStyle: "normal",
                    fontSize: 10,
                },
            });
            doc.save(getExportFilename("pdf", status, dateRange));
            toast.success("ส่งออก PDF สำเร็จ");
        } catch (error) {
            toast.error("ส่งออก PDF ไม่สำเร็จ");
        } finally {
            setLoadingExportPDF(false);
        }
    };

    const renderNotifyButton = (complaint: Complaint) => {
        const created = new Date(complaint.createdAt);
        const now = new Date();
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        const lastNotified = complaint.notifiedAt ? new Date(complaint.notifiedAt) : null;
        const isDone = complaint.status === "DONE";
        const notifiedDiff = lastNotified
            ? (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24)
            : Infinity;
        const disabled = isDone || diffDays < 1 || notifiedDiff < 1;

        let tooltipMessage = "แจ้งเตือนไปยังกลุ่มไลน์";
        if (isDone) tooltipMessage = "เรื่องนี้ดำเนินการเสร็จแล้ว";
        if (diffDays < 1) tooltipMessage = "แจ้งเตือนได้หลัง 1 วัน";
        else if (notifiedDiff < 1) tooltipMessage = "แจ้งเตือนไปแล้ววันนี้";

        return (
            <>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={!isDone ? "cursor-pointer" : "cursor-not-allowed"}>
                            <Button
                                className={!isDone ? "cursor-pointer" : "cursor-not-allowed"}
                                size="icon"
                                variant="ghost"
                                onClick={() => handleNotifyLine(complaint)}
                                disabled={disabled || loadingNotifyId === complaint.id}
                            >
                                <Bell className="w-4 h-4 text-blue-500" />
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>{tooltipMessage}</TooltipContent>
                </Tooltip>

                {confirmDialogId === complaint.id && (
                    <AlertDialog open onOpenChange={(open) => !open && setConfirmDialogId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการแจ้งเตือน</AlertDialogTitle>
                                <AlertDialogDescription>
                                    คุณแน่ใจหรือไม่ว่าต้องการแจ้งเตือนไปยังกลุ่มไลน์?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={() => confirmNotifyLine(complaint)}>
                                    ยืนยัน
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </>
        );
    };

    const renderReportButton = (complaint: Complaint) => {
        const isDone = complaint.status === "DONE";

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={!isDone ? "cursor-pointer" : "cursor-not-allowed"}>
                        {isDone ? (
                            <Button size="icon" variant="ghost" disabled>
                                <ClipboardCheck className="w-4 h-4 text-green-600" />
                            </Button>
                        ) : (
                            <Link href={`/admin/complaints/${complaint.id}/report`} >
                                <Button size="icon" variant="ghost" className="cursor-pointer">
                                    <ClipboardCheck className="w-4 h-4 text-green-600" />
                                </Button>
                            </Link>
                        )}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    {isDone
                        ? "ไม่สามารถรายงานผลได้ เนื่องจากเรื่องร้องเรียนเสร็จสิ้นแล้ว"
                        : "รายงานผล"}
                </TooltipContent>
            </Tooltip>
        );
    };

    const renderSourceBadge = (source: string) => {
        const colorMap: Record<string, string> = {
            LINE: "bg-green-100 text-green-700 border-green-300",
            FACEBOOK: "bg-blue-100 text-blue-700 border-blue-300",
            PHONE: "bg-yellow-100 text-yellow-800 border-yellow-300",
            COUNTER: "bg-pink-100 text-pink-700 border-pink-300",
            OTHER: "bg-gray-100 text-gray-800 border-gray-300",
        };

        const color = colorMap[source] ?? "bg-gray-100 text-gray-700 border-gray-300";

        return (
            <span className={`inline-block text-xs px-2 py-1 rounded border ${color}`}>
                {source}
            </span>
        );
    };

    return (
        <TooltipProvider>
            <div className="p-6 text-foreground space-y-6 transition-colors">
                <Card className="@container/card sticky top-0 z-50">
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                            {/* Search */}
                            <div className="md:col-span-3 lg:col-span-3 xl:col-span-2 flex flex-col gap-1">
                                <Label htmlFor="search">คำค้นหา</Label>
                                <Input
                                    id="search"
                                    placeholder="ค้นหาคำสำคัญ..."
                                    value={search}
                                    onChange={handleSearchChange}
                                />
                            </div>

                            {/* Date Range Picker */}
                            <div className="md:col-span-3 lg:col-span-3 xl:col-span-2 flex flex-col gap-1">
                                <Label>ช่วงวันที่</Label>
                                <DatePickerWithRange
                                    value={dateRange}
                                    onChange={(range) => {
                                        setDateRange(range);
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <div className="md:col-span-3 lg:col-span-3 xl:col-span-2 flex flex-wrap gap-2">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="source">ช่องทาง</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            setSource(val);
                                            setPage(1);
                                        }}
                                        value={source}
                                    >
                                        <SelectTrigger id="source">
                                            {source === "ALL"
                                                ? "ทั้งหมด"
                                                : sourceMap[source as keyof typeof sourceMap]?.label || source}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">ทั้งหมด</SelectItem>
                                            {Object.entries(sourceMap).map(([key, val]) => (
                                                <SelectItem key={key} value={key}>
                                                    {val.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="status">สถานะ</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            setStatus(val);
                                            setPage(1);
                                        }}
                                        value={status}
                                    >
                                        <SelectTrigger id="status">
                                            {status === "ALL"
                                                ? "ทั้งหมด"
                                                : statusMap[status as keyof typeof statusMap]?.label || status}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">ทั้งหมด</SelectItem>
                                            <SelectItem value="PENDING">PENDING</SelectItem>
                                            <SelectItem value="DONE">DONE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-1 items-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch("");
                                            setStatus("ALL");
                                            setSource("ALL");
                                            setDateRange(undefined);
                                            setPage(1);
                                            fetchData("");
                                        }}
                                        className="w-full"
                                    >
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        ล้าง
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
                <div className="flex flex-row justify-end items-center mb-4 gap-4">
                    <div className="flex flex-wrap gap-2 justify-end">
                        {selectedIds.length > 0 && (
                            <div className="hidden md:flex">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="cursor-pointer">
                                            <Trash2 className="w-4 h-4 mr-2" /> ลบรายการที่เลือก
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>คุณแน่ใจหรือไม่ว่าต้องการลบรายการที่เลือกนี้?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                การลบนี้จะลบข้อมูลรายการที่เลือกทั้งหมด และไม่สามารถเรียกคืนได้ (ยกเว้นกด "เลิกทำ")
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteSelected}>ลบรายการที่เลือก</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="cursor-pointer" variant="outline" size="icon">
                                    <FileDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={exportExcel}
                                    disabled={loadingExportExcel}
                                    className="cursor-pointer"
                                >
                                    <FileDown className="w-4 h-4 mr-2" />
                                    {loadingExportExcel ? "กำลังส่งออก Excel..." : "ส่งออก Excel"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={exportPDF}
                                    disabled={loadingExportPDF}
                                    className="cursor-pointer"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {loadingExportPDF ? "กำลังส่งออก PDF..." : "ส่งออก PDF"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {complaints.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลที่คุณค้นหา</div>
                ) : (
                    <>
                        <div className="grid gap-4 md:hidden">
                            <div className="flex items-center justify-end gap-2">
                                <Checkbox
                                    onCheckedChange={(checked) => {
                                        setSelectedIds(checked ? complaints.map(c => c.id) : []);
                                    }}
                                    checked={selectedIds.length === complaints.length && complaints.length > 0}
                                    aria-label="เลือกทั้งหมด"
                                />
                                <span className="text-sm text-muted-foreground">เลือกทั้งหมด</span>
                            </div>
                            {complaints.map((c) => {
                                const status = statusMap[c.status];
                                return (
                                    <Card key={c.id} className="shadow-sm space-y-2 relative">

                                        <div className="absolute top-2 right-2 z-10">
                                            <Checkbox
                                                checked={selectedIds.includes(c.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedIds(prev =>
                                                        checked
                                                            ? [...prev, c.id]
                                                            : prev.filter(id => id !== c.id)
                                                    );
                                                }}
                                                aria-label={`Select complaint ${c.id}`}
                                            />
                                        </div>

                                        <CardContent className="space-y-2">
                                            <div className="text-sm text-muted-foreground">
                                                วันที่แจ้ง: {format(new Date(c.createdAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                อัปเดตล่าสุด: {format(new Date(c.updatedAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}
                                            </div>
                                            <div className="font-medium">{c.description}</div>
                                            <div className="flex items-center gap-2">
                                                <span>ช่องทาง:</span> {renderSourceBadge(c.source)}
                                            </div>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                            <div className="text-sm text-muted-foreground">ผู้แจ้ง: {c.reporterName || "-"}</div>

                                            {isAdmin && (
                                                <div className="flex justify-end gap-2 pt-2">
                                                    {renderNotifyButton(c)}
                                                    {renderReportButton(c)}

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button size="icon" variant="ghost" asChild>
                                                                <Link href={`/complaints/${c.id}`}>
                                                                    <Eye className="w-4 h-4 text-violet-500" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>ดูรายละเอียด</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button size="icon" variant="ghost" asChild>
                                                                <Link href={`/admin/complaints/${c.id}/edit`}>
                                                                    <Pencil className="w-4 h-4 text-yellow-500" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>แก้ไขเรื่องร้องเรียน</TooltipContent>
                                                    </Tooltip>

                                                    <AlertDialog>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button size="icon" variant="ghost" className="cursor-pointer">
                                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                            </TooltipTrigger>
                                                            <TooltipContent>ลบเรื่องร้องเรียน</TooltipContent>
                                                        </Tooltip>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    การลบนี้จะลบข้อมูลทั้งหมด และไม่สามารถเรียกคืนได้ (ยกเว้นกด "เลิกทำ")
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(c.id)}>
                                                                    ลบรายการ
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        <div className="rounded-md border">
                            <Table className="hidden md:table">
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>
                                            <Checkbox
                                                onCheckedChange={(checked) => {
                                                    setSelectedIds(checked ? complaints.map(c => c.id) : []);
                                                }}
                                                checked={selectedIds.length === complaints.length && complaints.length > 0}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>ชื่อผู้ร้องเรียน</TableHead>
                                        <TableHead>รายละเอียด</TableHead>
                                        <TableHead>ช่องทาง</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                        <TableHead>วันที่บันทึก</TableHead>
                                        <TableHead>อัปเดตล่าสุด</TableHead>
                                        <TableHead className="text-right pe-10">การจัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {complaints.map((c) => {
                                        const status = statusMap[c.status];
                                        return (
                                            <TableRow key={c.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(c.id)}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedIds(prev =>
                                                                checked
                                                                    ? [...prev, c.id]
                                                                    : prev.filter(id => id !== c.id)
                                                            );
                                                        }}
                                                        aria-label={`Select complaint ${c.id}`}
                                                    />
                                                </TableCell>
                                                <TableCell>{c.reporterName || "-"}</TableCell>
                                                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">{c.description}</TableCell>
                                                <TableCell>
                                                    {renderSourceBadge(c.source)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(new Date(c.createdAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}</TableCell>
                                                <TableCell>{format(new Date(c.updatedAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}</TableCell>
                                                <TableCell className="flex justify-end gap-2">
                                                    {renderNotifyButton(c)}
                                                    {renderReportButton(c)}
                                                    <DropdownMenu>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="icon" variant="ghost" className="cursor-pointer">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                            </TooltipTrigger>
                                                            <TooltipContent>เมนูเพิ่มเติม</TooltipContent>
                                                        </Tooltip>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/complaints/${c.id}`} className="w-full cursor-pointer">รายละเอียด</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/complaints/${c.id}/edit`} className="w-full cursor-pointer">แก้ไข</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem variant="destructive" onClick={() => setOpenDialogId(c.id)} className="text-red-500 cursor-pointer">
                                                                ลบ
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <AlertDialog open={openDialogId === c.id} onOpenChange={(open) => !open && setOpenDialogId(null)}>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    การลบนี้จะลบข้อมูลทั้งหมด และไม่สามารถเรียกคืนได้ (ยกเว้นกด "เลิกทำ")
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => {
                                                                    handleDelete(c.id);
                                                                    setOpenDialogId(null);
                                                                }}>
                                                                    ลบรายการ
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-4">
                    <div className="hidden lg:block text-sm text-muted-foreground">
                        {selectedIds.length} จาก {complaints.length} รายการถูกเลือก
                    </div>

                    <div className="flex flex-row lg:items-center gap-2 lg:gap-4 w-full lg:w-auto justify-between">
                        <div className="hidden lg:flex justify-center items-center gap-2">
                            <span className="text-sm">แสดง:</span>
                            <Select value={limit.toString()} onValueChange={(val) => {
                                setLimit(Number(val));
                                setPage(1);
                            }}>
                                <SelectTrigger className="w-[80px]">
                                    {limit}
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50, 100].map(val => (
                                        <SelectItem key={val} value={val.toString()}>{val}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm">รายการ</span>
                        </div>
                        <div className="flex justify-center items-center gap-2">
                            <span className="text-sm mx-2 whitespace-nowrap">หน้า {page} จาก {totalPages}</span>
                        </div>
                        <div className="inline-flex justify-center gap-1">
                            <Button variant="outline" onClick={() => setPage(1)} disabled={page === 1}>
                                <ChevronsLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {selectedIds.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 md:hidden">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="lg" variant="destructive" className="rounded-full cursor-pointer">
                                <Trash2 className="w-4 h-4 mr-2" /> ลบรายการ
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>คุณแน่ใจหรือไม่ว่าต้องการลบรายการที่เลือกนี้?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    การลบนี้จะลบข้อมูลรายการที่เลือกทั้งหมด และไม่สามารถเรียกคืนได้ (ยกเว้นกด "เลิกทำ")
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>ลบรายการที่เลือก</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </TooltipProvider>
    );
}
