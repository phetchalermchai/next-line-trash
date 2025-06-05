"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/complaint/DatePickerWithRange";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import api from "@/lib/axios";
import { CheckCircle, Hourglass, Trash2, Pencil, Bell, FileDown, FileText } from "lucide-react";
import debounce from "lodash.debounce";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font as sarabunFont } from "@/utils/fonts/Sarabun-normal";

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

interface Complaint {
    id: string;
    lineUserId: string;
    lineDisplayName?: string;
    phone?: string;
    description: string;
    imageBefore: string;
    imageAfter?: string;
    location?: string;
    status: "PENDING" | "DONE";
    message?: string;
    notifiedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

const statusMap = {
    PENDING: {
        label: "รอดำเนินการ",
        icon: <Hourglass className="w-3.5 h-3.5" />,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20",
    },
    DONE: {
        label: "เสร็จสิ้น",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        color: "bg-green-100 text-green-800 dark:bg-green-800/20",
    },
};

export default function ComplaintSearchPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingNotifyId, setLoadingNotifyId] = useState<string | null>(null);
    const [confirmDialogId, setConfirmDialogId] = useState<string | null>(null);
    const [notifiedAtMap, setNotifiedAtMap] = useState<Record<string, Date>>({});

    const fetchData = async (overrideSearch?: string) => {
        const params = new URLSearchParams();
        const keyword = overrideSearch ?? search;
        if (keyword) params.append("search", keyword);
        if (status !== "ALL") params.append("status", status);
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

        const lastNotified = notifiedAtMap[complaint.id];
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
            setNotifiedAtMap((prev) => ({ ...prev, [complaint.id]: new Date() }));
            toast.success("แจ้งเตือนไปยังกลุ่มไลน์แล้ว");
        } catch (err) {
            console.error("แจ้งเตือนไม่สำเร็จ", err);
            toast.error("ไม่สามารถแจ้งเตือนได้");
        } finally {
            setLoadingNotifyId(null);
        }
    };



    const exportExcel = async () => {
        const allComplaints = filterSelected(await fetchAllData());
        const header = [
            ["รายงานข้อมูลเรื่องร้องเรียน"],
            [
                `สถานะ: ${status === "ALL" ? "ทั้งหมด" : statusMap[status as keyof typeof statusMap]?.label}`,
            ],
            [
                dateRange?.from && dateRange?.to
                    ? `ช่วงวันที่: ${format(dateRange.from, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())} - ${format(dateRange.to, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}`
                    : ""
            ],
            []
        ];
        const mapped = allComplaints.map(c => ({
            "ชื่อผู้ร้องเรียน": c.lineDisplayName || "",
            "เบอร์โทร": c.phone || "",
            "รายละเอียด": c.description,
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
        const date = new Date().toISOString().slice(0, 10);
        saveAs(data, `complaints-${date}.xlsx`);
    };

    const exportPDF = async () => {
        const allComplaints = filterSelected(await fetchAllData());
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFont("Sarabun");
        doc.setFontSize(10);
        doc.text("รายงานข้อมูลเรื่องร้องเรียน", 14, 10);
        doc.setFontSize(10);
        doc.text(`สถานะ: ${status === "ALL" ? "ทั้งหมด" : statusMap[status as keyof typeof statusMap]?.label}`, 14, 16);
        if (dateRange?.from && dateRange?.to) {
            doc.text(`ช่วงวันที่: ${format(dateRange.from, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())} - ${format(dateRange.to, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}`, 14, 22);
        }
        autoTable(doc, {
            startY: 28,
            head: [[
                "ชื่อผู้ร้องเรียน", "เบอร์โทร", "รายละเอียด",
                "พิกัด", "สถานะ", "สรุปผล", "วันที่บันทึก", "วันที่อัพเดท"
            ]],
            body: allComplaints.map(c => [
                c.lineDisplayName || "",
                c.phone || "",
                c.description,
                c.location || "",
                c.status,
                c.message || "",
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
        const date = new Date().toISOString().slice(0, 10);
        doc.save(`complaints-${date}.pdf`);
    };

    const renderNotifyButton = (complaint: Complaint) => {
        const created = new Date(complaint.createdAt);
        const now = new Date();
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        const lastNotified = notifiedAtMap[complaint.id];
        const notifiedDiff = lastNotified
            ? (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24)
            : Infinity;
        const disabled = diffDays < 1 || notifiedDiff < 1;

        let tooltipMessage = "แจ้งเตือนไปยังกลุ่มไลน์";
        if (diffDays < 1) tooltipMessage = "แจ้งเตือนได้หลัง 1 วัน";
        else if (notifiedDiff < 1) tooltipMessage = "แจ้งเตือนไปแล้ววันนี้";

        return (
            <>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleNotifyLine(complaint)}
                            disabled={disabled || loadingNotifyId === complaint.id}
                        >
                            <Bell className="w-4 h-4 text-blue-500" />
                        </Button>
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

    return (
        <TooltipProvider>
            <div className="p-6 bg-background text-foreground rounded-xl shadow-md space-y-6">
                <h1 className="text-2xl font-semibold border-b pb-2 flex justify-between items-center">
                    ค้นหาร้องเรียนย้อนหลัง
                    <div className="flex gap-2">
                        <Button onClick={exportExcel} variant="outline"><FileDown className="w-4 h-4 mr-2 cursor-pointer" /> ดาวน์โหลด Excel</Button>
                        <Button onClick={exportPDF} variant="outline"><FileText className="w-4 h-4 mr-2 cursor-pointer" /> ส่งออก PDF</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={selectedIds.length === 0} className="cursor-pointer">
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
                </h1>
                <div className="sticky top-0 z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted p-4 rounded-lg shadow-sm">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-muted-foreground">คำค้นหา</label>
                        <Input
                            placeholder="ค้นหาคำสำคัญ..."
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
                        <Select onValueChange={(val) => { setStatus(val); setPage(1); }} value={status}>
                            <SelectTrigger>
                                {status === "ALL" ? "ทั้งหมด" : statusMap[status as keyof typeof statusMap]?.label || status}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                                <SelectItem value="PENDING">PENDING</SelectItem>
                                <SelectItem value="DONE">DONE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-muted-foreground">ช่วงวันที่</label>
                        <DatePickerWithRange value={dateRange} onChange={(range) => { setDateRange(range); setPage(1); }} />
                    </div>

                    <div className="flex items-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch("");
                                setStatus("ALL");
                                setDateRange(undefined);
                                setPage(1);
                                fetchData("");
                            }}
                            className="w-full cursor-pointer"
                        >
                            ล้าง
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg overflow-x-auto bg-card">
                    {complaints.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลที่คุณค้นหา</div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:hidden">
                                {complaints.map((c) => {
                                    const status = statusMap[c.status];
                                    return (
                                        <div key={c.id} className="border p-4 rounded-md shadow-sm space-y-2">
                                            <div className="text-sm text-muted-foreground">{format(new Date(c.createdAt), "dd/MM/yyyy")}</div>
                                            <div className="font-medium">{c.description}</div>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                            <div className="text-sm text-muted-foreground">ผู้แจ้ง: {c.lineDisplayName || "-"}</div>
                                            {isAdmin && (
                                                <div className="flex justify-end gap-2">
                                                    {renderNotifyButton(c)}
                                                    <Button size="icon" variant="ghost" asChild>
                                                        <Link href={`/admin/complaints/${c.id}/edit`}>
                                                            <Pencil className="w-4 h-4 text-yellow-500" />
                                                        </Link>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="cursor-pointer">
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </AlertDialogTrigger>
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
                                        </div>
                                    );
                                })}
                            </div>

                            <Table className="hidden md:table">
                                <TableHeader>
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
                                        <TableHead>สถานะ</TableHead>
                                        <TableHead>วันที่บันทึก</TableHead>
                                        <TableHead className="text-right">การจัดการ</TableHead>
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
                                                <TableCell>{c.lineDisplayName || "-"}</TableCell>
                                                <TableCell>{c.description}</TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(new Date(c.createdAt), "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}</TableCell>
                                                <TableCell className="flex justify-end gap-2">
                                                    {renderNotifyButton(c)}
                                                    <Button size="icon" variant="ghost" asChild>
                                                        <Link href={`/admin/complaints/${c.id}/edit`}>
                                                            <Pencil className="w-4 h-4 text-yellow-500" />
                                                        </Link>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="cursor-pointer">
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </AlertDialogTrigger>
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
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </div>

                <div className="flex justify-center pt-4">
                    <div className="inline-flex gap-2">
                        <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                            ก่อนหน้า
                        </Button>
                        <span className="px-2 py-1 text-sm font-medium">
                            หน้า {page} / {totalPages}
                        </span>
                        <Button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                            ถัดไป
                        </Button>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
