// file: app/(private)/admin/complaints/manage/page.tsx
"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Complaint } from "@/types/complaint";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { DatePickerWithRange } from "@/components/complaint/DatePickerWithRange";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/lib/use-media-query";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { colorMap, statusMap } from "@/utils/complaintLabels";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font as sarabunFont } from "@/utils/fonts/Sarabun-normal";
import { getExportFilename } from "@/utils/getExportFilename";
import ActionsDropdown from "@/components/complaint/ActionsDropdown";
import { ComplaintImages } from "@/components/complaint/ComplaintImages";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });

const sourceLabel: Record<string, string> = {
    LINE: "LINE",
    FACEBOOK: "FACEBOOK",
    PHONE: "PHONE",
    COUNTER: "COUNTER",
    OTHER: "OTHER",
};

export default function ManageComplaintsPage() {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [complaints, setComplaints] = React.useState<Complaint[]>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [dateRange, setDateRange] = React.useState<any>();
    const [status, setStatus] = React.useState<"ALL" | "PENDING" | "DONE">("ALL");
    const [source, setSource] = React.useState<"ALL" | "LINE" | "FACEBOOK" | "PHONE" | "COUNTER" | "OTHER">("ALL");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [viewComplaint, setViewComplaint] = React.useState<Complaint | null>(null);
    const [deleteComplaint, setDeleteComplaint] = React.useState<Complaint | null>(null);
    const [editComplaint, setEditComplaint] = React.useState<Complaint | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [loadingFetch, setLoadingFetch] = React.useState(false);
    const [loadingExport, setLoadingExport] = React.useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    // GET complaints
    const refreshComplaints = async () => {
        setLoadingFetch(true);
        try {
            const params = new URLSearchParams();
            if (globalFilter) params.set("search", globalFilter);
            if (status && status !== "ALL") params.set("status", status);
            if (source && source !== "ALL") params.set("source", source);
            if (dateRange?.from) params.set("startDate", dateRange.from.toISOString());
            if (dateRange?.to) params.set("endDate", dateRange.to.toISOString());
            params.set("page", "1");
            params.set("limit", "10");

            const url = params.toString() ? `/api/complaints?${params.toString()}` : "/api/complaints";

            const res = await axios.get(url);
            const complaintsData = res.data?.items || [];
            setComplaints(complaintsData);
            console.log("✅ Complaints:", complaintsData);
            if (complaintsData.length === 0) {
                toast.info("ไม่พบเรื่องร้องเรียนตามเงื่อนไข");
            }
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลร้องเรียน");
        } finally {
            setLoadingFetch(false);
        }
    };

    React.useEffect(() => {
        refreshComplaints();
    }, [globalFilter, dateRange, status]);

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return toast.warning("กรุณาเลือกเรื่องร้องเรียนก่อน");

        setIsDeleting(true);
        try {
            await Promise.all(selectedIds.map(id => axios.delete(`/api/complaints/${id}`)));
            toast.success("ลบเรื่องร้องเรียนที่เลือกสำเร็จ");
            setSelectedIds([]);
            refreshComplaints();
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการลบหลายรายการ");
        } finally {
            setIsDeleting(false);
        }
    };

    const renderSelectHeader = () => (
        <Checkbox
            checked={selectedIds.length === complaints.length && complaints.length > 0}
            onCheckedChange={(checked) => {
                setSelectedIds(checked ? complaints.map(c => c.id) : []);
            }}
            aria-label="Select all"
        />
    );

    const renderSelectCell = ({ row }: { row: { original: Complaint } }) => (
        <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={(checked) => {
                setSelectedIds((prev) =>
                    checked ? [...prev, row.original.id] : prev.filter((id) => id !== row.original.id)
                );
            }}
            aria-label="Select row"
        />
    );

    const table = useReactTable({
        data: complaints,
        columns: [
            {
                id: "select",
                header: renderSelectHeader,
                cell: renderSelectCell,
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "reporterName",
                header: "ชื่อผู้ร้องเรียน",
                cell: ({ row }) => row.original.reporterName || row.original.lineUserId || "-",
            },
            {
                accessorKey: "description",
                header: "รายละเอียด",
            },
            {
                accessorKey: "source",
                header: "ช่องทาง",
                cell: ({ row }) => (
                    <Badge className={`${colorMap[row.original.source] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
                        {sourceLabel[row.original.source] || row.original.source}
                    </Badge>
                ),
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: ({ row }) => (
                    <Badge className={`${statusMap[row.original.status]?.color || "bg-gray-100 text-gray-800"}`}>
                        {statusMap[row.original.status]?.label}
                    </Badge>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "วันที่บันทึก",
                cell: ({ row }) => format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm"),
            },
            {
                accessorKey: "updatedAt",
                header: "อัปเดตล่าสุด",
                cell: ({ row }) => format(new Date(row.original.updatedAt), "dd/MM/yyyy HH:mm"),
            },
            {
                id: "actions",
                header: "การจัดการ",
                cell: ({ row }) => (
                    <ActionsDropdown
                        complaint={row.original}
                        onView={setViewComplaint}
                        onEdit={setEditComplaint}
                        onDelete={setDeleteComplaint}
                    />
                ),
            },
        ],
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const handleConfirmDeleteComplaint = async () => {
        if (!deleteComplaint || isDeleting) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/api/complaints/${deleteComplaint.id}`);
            toast.success("ลบเรื่องร้องเรียนสำเร็จ");
            refreshComplaints();
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setIsDeleting(false);
            setDeleteComplaint(null);
        }
    };

    const handleExportExcel = async () => {
        setLoadingExport(true);
        try {
            const selected = selectedIds.length > 0 ? complaints.filter(c => selectedIds.includes(c.id)) : complaints;

            const header = [
                ["รายงานข้อมูลเรื่องร้องเรียน"],
                [`สถานะ: ${status === "ALL" ? "ทั้งหมด" : statusMap[status]?.label}`],
                [`ช่องทาง: ${source === "ALL" ? "ทั้งหมด" : source}`],
                [dateRange?.from && dateRange?.to
                    ? `ช่วงวันที่: ${format(dateRange.from, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())} - ${format(dateRange.to, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}`
                    : ""],
                []
            ];

            const exportData = selected.map(item => ({
                "ชื่อผู้ร้องเรียน": item.reporterName || item.lineUserId || "-",
                "รายละเอียด": item.description,
                "ช่องทาง": item.source,
                "สถานะ": statusMap[item.status]?.label,
                "วันที่บันทึก": format(new Date(item.createdAt), "dd/MM/yyyy HH:mm"),
                "อัปเดตล่าสุด": format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm"),
            }));

            const worksheet = XLSX.utils.json_to_sheet([]);
            XLSX.utils.sheet_add_aoa(worksheet, header, { origin: 0 });
            XLSX.utils.sheet_add_json(worksheet, exportData, { origin: -1 });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");

            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const data = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(data, getExportFilename({ type: "excel", prefix: "เรื่องร้องเรียน" }));
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการส่งออก Excel");
        } finally {
            setLoadingExport(false);
        }
    };

    const handleExportPDF = async () => {
        setLoadingExport(true);
        try {
            const selected = selectedIds.length > 0 ? complaints.filter(c => selectedIds.includes(c.id)) : complaints;

            const doc = new jsPDF("landscape");
            doc.addFileToVFS("Sarabun.ttf", sarabunFont);
            doc.addFont("Sarabun.ttf", "Sarabun", "normal");
            doc.setFont("Sarabun");
            doc.setFontSize(10);

            doc.text("รายงานข้อมูลเรื่องร้องเรียน", 14, 10);
            doc.text(`สถานะ: ${status === "ALL" ? "ทั้งหมด" : statusMap[status]?.label}`, 14, 16);
            doc.text(`ช่องทาง: ${source === "ALL" ? "ทั้งหมด" : source}`, 14, 22);
            if (dateRange?.from && dateRange?.to) {
                doc.text(`ช่วงวันที่: ${format(dateRange.from, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())} - ${format(dateRange.to, "dd/MM/yyyy").replace(/\d{4}$/, y => (parseInt(y) + 543).toString())}`, 14, 28);
            }

            autoTable(doc, {
                startY: 34,
                head: [["ชื่อผู้ร้องเรียน", "รายละเอียด", "ช่องทาง", "สถานะ", "วันที่บันทึก", "อัปเดตล่าสุด"]],
                body: selected.map(item => [
                    String(item.reporterName || item.lineUserId || "-"),
                    String(item.description),
                    String(item.source),
                    String(statusMap[item.status]?.label),
                    String(format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")),
                    String(format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm")),
                ]),
                styles: {
                    font: "Sarabun",
                    fontStyle: "normal",
                    fontSize: 10,
                },
            });

            doc.save(getExportFilename({ type: "pdf", prefix: "เรื่องร้องเรียน" }));
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการส่งออก PDF");
        } finally {
            setLoadingExport(false);
        }
    };

    return (
        <div className="space-y-4 m-6">
            <h2 className="text-xl font-bold">ค้นหาเรื่องร้องเรียน</h2>
            <div className="flex flex-wrap gap-2 items-center">
                <Input
                    placeholder="ค้นหา (เช่น ชื่อผู้แจ้ง/เบอร์/รายละเอียด)..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <div className="w-full md:w-auto max-w-sm grow">
                    <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                </div>
                <div className="flex gap-2 items-center">
                    <Select onValueChange={v => setStatus(v as any)} value={status}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="ทุกสถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                            <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
                            <SelectItem value="DONE">เสร็จสิ้น</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={v => setSource(v as any)} value={source}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="ทุกช่องทาง" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">ทุกช่องทาง</SelectItem>
                            <SelectItem value="LINE">LINE</SelectItem>
                            <SelectItem value="FACEBOOK">FACEBOOK</SelectItem>
                            <SelectItem value="PHONE">PHONE</SelectItem>
                            <SelectItem value="COUNTER">COUNTER</SelectItem>
                            <SelectItem value="OTHER">OTHER</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                <Button className="cursor-pointer" variant="destructive" disabled={selectedIds.length === 0 || isDeleting} onClick={handleDeleteSelected}>
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} ลบทั้งหมด
                </Button>
                <Button className="cursor-pointer" onClick={handleExportExcel} disabled={loadingExport}>
                    {loadingExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Excel
                </Button>
                <Button className="cursor-pointer" onClick={handleExportPDF} disabled={loadingExport} variant="outline">
                    {loadingExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}PDF
                </Button>
            </div>
            {isMobile && (
                <div className="flex items-center justify-end gap-2">
                    <Checkbox
                        checked={selectedIds.length === complaints.length && complaints.length > 0}
                        onCheckedChange={(checked) => {
                            setSelectedIds(checked ? complaints.map(c => c.id) : []);
                        }}
                        aria-label="เลือกทั้งหมด"
                    />
                    <span className="text-sm text-muted-foreground">เลือกทั้งหมด</span>
                </div>
            )}
            {/* Table View */}
            {loadingFetch ? (
                <div>Loading...</div>
            ) : !isMobile ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <TableHead key={header.id} className="ps-5">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className="ps-5">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        ไม่มีข้อมูล
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map(row => (
                            <Card key={row.id} className="shadow">
                                <CardContent className="pt-2 space-y-2">
                                    {row.getVisibleCells().map(cell => (
                                        <div key={cell.id} className="text-sm relative">
                                            {cell.column.id === "select" ? (
                                                <div className="absolute top-2 right-2 z-10">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            ) : (
                                                <>
                                                    <strong>{String(cell.column.columnDef.header)}:</strong>{" "}
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
                    )}
                </div>
            )}
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    ก่อนหน้า
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    ถัดไป
                </Button>
            </div>
            {/* Drawer & Dialog ดูรายละเอียด/ลบ */}
            {viewComplaint && (
                <Drawer direction={isMobile ? "bottom" : "right"} open={!!viewComplaint} onOpenChange={() => setViewComplaint(null)}>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>รายละเอียดเรื่องร้องเรียน</DrawerTitle>
                            <DrawerDescription>
                                <Badge className={`${colorMap[viewComplaint.source] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
                                    {sourceLabel[viewComplaint.source] || viewComplaint.source}
                                </Badge>
                                <Badge className={`${statusMap[viewComplaint.status]?.color || "bg-gray-100 text-gray-800"} ml-2`}>
                                    {statusMap[viewComplaint.status]?.label}
                                </Badge>
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 py-2 space-y-4 text-sm overflow-y-auto max-h-screen">
                            <div><strong>ID:</strong> #{viewComplaint.id.slice(-6).toUpperCase()}</div>
                            <div><strong>ชื่อผู้แจ้ง:</strong> {viewComplaint.reporterName || viewComplaint.lineUserId || "-"}</div>
                            {viewComplaint.receivedBy && (
                                <div><strong>รับเรื่องโดย:</strong> {viewComplaint.receivedBy}</div>
                            )}
                            <div><strong>เบอร์โทร:</strong> {viewComplaint.phone || "-"}</div>
                            <div><strong>วันที่แจ้ง:</strong> {format(new Date(viewComplaint.createdAt), "dd/MM/yyyy HH:mm")}</div>
                            <div><strong>วันที่อัปเดต:</strong> {format(new Date(viewComplaint.updatedAt), "dd/MM/yyyy HH:mm")}</div>
                            {viewComplaint.notifiedAt && (
                                <div><strong>วันที่แจ้งเตือน:</strong> {format(new Date(viewComplaint.notifiedAt), "dd/MM/yyyy HH:mm")}</div>
                            )}
                            <div>
                                <Label className="text-sm font-semibold mb-2">ตำแหน่งที่ตั้ง</Label>
                                {viewComplaint.location ? (
                                    <a
                                        href={`https://www.google.com/maps?q=${encodeURIComponent(viewComplaint.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MiniMapPreview location={viewComplaint.location} />
                                    </a>
                                ) : (
                                    <p className="text-sm text-muted-foreground">ไม่มีพิกัดที่ตั้ง</p>
                                )}
                            </div>
                            <div><strong>รายละเอียด:</strong> {viewComplaint.description}</div>
                            {viewComplaint.message && (
                                <div><strong>ข้อความตอบกลับ:</strong> {viewComplaint.message}</div>
                            )}
                            <ComplaintImages
                                imageBefore={viewComplaint?.imageBefore?.split(",").map(u => u.trim()) || []}
                                imageAfter={viewComplaint?.imageAfter?.split(",").map(u => u.trim()) || []}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
            {deleteComplaint && (
                <Dialog open={!!deleteComplaint} onOpenChange={() => setDeleteComplaint(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>ยืนยันการลบเรื่องร้องเรียน</DialogTitle>
                            <p>คุณต้องการลบเรื่องร้องเรียน <strong>#{deleteComplaint.id.slice(-6).toUpperCase()}</strong> หรือไม่?</p>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteComplaint(null)}>ยกเลิก</Button>
                            <Button variant="destructive" disabled={isDeleting} onClick={handleConfirmDeleteComplaint}>
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} ลบ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
