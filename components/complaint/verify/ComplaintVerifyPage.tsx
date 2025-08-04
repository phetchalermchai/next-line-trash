"use client";
import { useEffect, useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, getSortedRowModel } from "@tanstack/react-table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ActionsDropdown from "@/components/complaint/ActionsDropdown";
import axios from "axios";
import { Complaint } from "@/types/complaint";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatThaiDatetime } from "@/utils/date";
import { colorMap, statusMap } from "@/utils/complaintLabels";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { ComplaintImages } from "../ComplaintImages";
import EditComplaintDrawer from "../EditComplaintDrawer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/lib/use-media-query";
import dynamic from "next/dynamic";

const MiniMapPreview = dynamic(() => import("@/components/MiniMapPreview"), { ssr: false });

const sourceLabel: Record<string, string> = {
    LINE: "LINE",
    FACEBOOK: "FACEBOOK",
    PHONE: "PHONE",
    COUNTER: "COUNTER",
    OTHER: "OTHER",
};

export default function ComplaintVerifyList() {
    const [data, setData] = useState<Complaint[]>([]);
    const [reason, setReason] = useState("");
    const [openReopenDialogId, setOpenReopenDialogId] = useState<string | null>(null);
    const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);
    const [deleteComplaint, setDeleteComplaint] = useState<Complaint | null>(null);
    const [editComplaint, setEditComplaint] = useState<Complaint | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `/api/complaints?status=DONE&page=${pageIndex + 1}&limit=${pageSize}`
            );
            setData(res.data.items);
            setTotalPages(res.data.totalPages);
        } catch (e) {
            toast.error("โหลดข้อมูลล้มเหลว");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [pageIndex, pageSize]);

    // ปุ่มยืนยันผล
    const handleVerify = async (id: string) => {
        try {
            await axios.patch(`/api/complaints/${id}/verify`);
            toast.success("ยืนยันผลสำเร็จ");
            fetchComplaints();
        } catch {
            toast.error("เกิดข้อผิดพลาดในการยืนยันผล");
        }
    };

    const handleReopen = async () => {
        if (!openReopenDialogId) return;
        if (!reason.trim()) {
            toast.warning("กรุณาระบุเหตุผล");
            return;
        }
        try {
            await axios.patch(`/api/complaints/${openReopenDialogId}/reopen`, { reason });
            toast.success("เปลี่ยนสถานะเป็น 'ขอแก้ไข' เรียบร้อย");
            setReason("");
            setOpenReopenDialogId(null);
            fetchComplaints();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "เกิดข้อผิดพลาด");
        }
    };

    const handleConfirmDeleteComplaint = async () => {
        if (!deleteComplaint || isDeleting) return;
        setIsDeleting(true);
        try {
            const backup = { ...deleteComplaint };
            await axios.delete(`/api/complaints/${deleteComplaint.id}`);
            toast.success("ลบสำเร็จ", {
                description: "รูปภาพจะไม่สามารถเรียกคืนได้",
                action: {
                    label: "เลิกทำ",
                    onClick: async () => {
                        try {
                            await axios.post("/api/complaints/undo-delete", backup);
                            toast.success("เรียกคืนสำเร็จ");
                            fetchComplaints();
                        } catch (err) {
                            console.error("[UNDO DELETE] Error:", err);
                            toast.error("ไม่สามารถเลิกทำได้");
                        }
                    },
                },
            });
            fetchComplaints();
        } catch (error) {
            console.error("[DELETE Complaint] Error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setIsDeleting(false);
            setDeleteComplaint(null);
        }
    };

    const columns: ColumnDef<Complaint>[] = [
        // ... ตามตัวอย่างข้างบน
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllRowsSelected()}
                    onCheckedChange={value => table.toggleAllRowsSelected(!!value)}
                    aria-label="เลือกทั้งหมด"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={value => row.toggleSelected(!!value)}
                    aria-label="เลือกแถว"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 30,
        },
        {
            header: "รหัสอ้างอิง",
            accessorKey: "id",
            cell: ({ row }) => <>#{row.original.id.slice(-6).toUpperCase()}</>
        },
        {
            header: "ชื่อผู้ร้องเรียน",
            accessorKey: "reporterName",
            cell: ({ row }) => row.original.reporterName || "-",
        },
        {
            header: "รายละเอียด",
            accessorKey: "description",
            cell: ({ row }) => (
                <span title={row.original.description}>
                    {row.original.description.length > 30
                        ? row.original.description.slice(0, 30) + "..."
                        : row.original.description}
                </span>
            )
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
            accessorKey: "source",
            header: "ช่องทาง",
            cell: ({ row }) => (
                <Badge className={`${colorMap[row.original.source] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
                    {sourceLabel[row.original.source] || row.original.source}
                </Badge>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "วันที่บันทึก",
            cell: ({ row }) => formatThaiDatetime(row.original.createdAt),
        },
        {
            accessorKey: "updatedAt",
            header: "อัปเดตล่าสุด",
            cell: ({ row }) => formatThaiDatetime(row.original.updatedAt),
        },
        {
            id: "actions",
            header: "การจัดการ",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    {/* VERIFIED */}
                    <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="cursor-pointer">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                    </Button>
                                </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>ยืนยันผล</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการตรวจสอบ</AlertDialogTitle>
                                <AlertDialogDescription>
                                    คุณต้องการยืนยันเรื่องนี้เป็น VERIFIED ใช่หรือไม่?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleVerify(row.original.id)}
                                    className="cursor-pointer"
                                >
                                    ยืนยัน
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* UNVERIFIED */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setOpenReopenDialogId(row.original.id);
                                        setReason("");
                                    }}
                                >
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </Button>
                        </TooltipTrigger>
                        <TooltipContent>ไม่ยืนยันผล</TooltipContent>
                    </Tooltip>
                    {/* เมนู actions เพิ่มเติม */}
                    <ActionsDropdown
                        complaint={row.original}
                        onView={setViewComplaint}
                        onEdit={setEditComplaint}
                        onDelete={setDeleteComplaint}
                    />
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        pageCount: totalPages,
        state: {
            pagination: { pageIndex, pageSize },
        },
        onPaginationChange: up => {
            const next = typeof up === "function" ? up({ pageIndex, pageSize }) : up;
            setPageIndex(next.pageIndex);
            setPageSize(next.pageSize);
        }
    });

    return (
        <div className="space-y-4 m-6">
            <h2 className="text-xl font-bold">ค้นหาเรื่องร้องเรียน</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map(row => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0}>
                    ก่อนหน้า
                </Button>
                <span>หน้า {pageIndex + 1} / {totalPages}</span>
                <Button onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))} disabled={pageIndex + 1 >= totalPages}>
                    ถัดไป
                </Button>
            </div>
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
                        <div className="px-4 pt-2 pb-4 space-y-4 text-sm overflow-y-auto max-h-screen">
                            <div><strong>รหัสอ้างอิง:</strong> #{viewComplaint.id.slice(-6).toUpperCase()}</div>
                            <div><strong>วันที่แจ้ง:</strong> {formatThaiDatetime(viewComplaint.createdAt)}</div>
                            <div><strong>วันที่อัปเดต:</strong> {formatThaiDatetime(viewComplaint.updatedAt)}</div>
                            {viewComplaint.notifiedAt && (
                                <div><strong>วันที่แจ้งเตือน:</strong> {formatThaiDatetime(viewComplaint.notifiedAt)}</div>
                            )}
                            <div><strong>ชื่อผู้แจ้ง:</strong> {viewComplaint.reporterName || viewComplaint.lineUserId || "-"}</div>
                            {viewComplaint.receivedBy && (
                                <div><strong>รับเรื่องโดย:</strong> {viewComplaint.receivedBy}</div>
                            )}
                            <div><strong>เบอร์โทร:</strong> {viewComplaint.phone || "-"}</div>

                            <div><strong>รายละเอียด:</strong> {viewComplaint.description}</div>
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

                            {viewComplaint.message && (
                                <div><strong>ข้อความตอบกลับ:</strong> {viewComplaint.message}</div>
                            )}
                            {viewComplaint.reopenLogs && viewComplaint.reopenLogs.length > 0 && (
                                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-md p-3 space-y-2">
                                    <div className="font-bold text-orange-700 flex items-center gap-2">
                                        ประวัติขอแก้ไข ({viewComplaint.reopenLogs.length} ครั้ง)
                                    </div>
                                    <ul className="space-y-1">
                                        {viewComplaint.reopenLogs.map((log, idx) => (
                                            <li key={log.id} className="border-l-2 border-orange-400 pl-2 text-sm">
                                                <div>
                                                    <span className="font-medium text-orange-800">ครั้งที่ {idx + 1}</span>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({formatThaiDatetime(log.createdAt)} น.)
                                                    </span>
                                                </div>
                                                <div className="text-gray-500">
                                                    <span className="text-gray-700">โดย:</span> {log.reporterName || "-"}
                                                </div>
                                                <div className="text-gray-500">
                                                    <span className="text-gray-700">เหตุผล:</span> {log.reason}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <ComplaintImages
                                imageBefore={viewComplaint?.imageBefore?.split(",").map(u => u.trim()) || []}
                                imageAfter={viewComplaint?.imageAfter?.split(",").map(u => u.trim()) || []}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
            {editComplaint && (
                <EditComplaintDrawer
                    complaint={editComplaint}
                    open={!!editComplaint}
                    onClose={() => setEditComplaint(null)}
                    onSave={async (data: Record<string, any>) => {
                        if (!editComplaint) return;
                        const formData = new FormData();

                        // รวมข้อมูลไฟล์และ URL
                        Object.entries(data).forEach(([key, value]) => {
                            if (key === "imageBeforeFiles" || key === "imageAfterFiles") {
                                (value as File[]).forEach((file) => {
                                    formData.append(key, file);
                                });
                            } else if (value !== undefined && value !== null) {
                                formData.append(key, String(value));
                            }
                        });

                        const logFormData = (formData: FormData) => {
                            for (const [key, value] of formData.entries()) {
                                console.log(`🟢 formData: ${key}`, value);
                            }
                        };

                        logFormData(formData);

                        try {
                            await axios.patch(`/api/complaints/${editComplaint.id}`, formData);
                            toast.success("อัปเดตข้อมูลสำเร็จ");
                            fetchComplaints();
                            setEditComplaint(null);
                        } catch (error) {
                            console.error("[PATCH Complaint] Error:", error);
                            toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
                        }
                    }}

                />
            )}
            {deleteComplaint && (
                <Dialog open={!!deleteComplaint} onOpenChange={() => setDeleteComplaint(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>ยืนยันการลบเรื่องร้องเรียน</DialogTitle>
                            <DialogDescription>คุณต้องการลบเรื่องร้องเรียน <strong>#{deleteComplaint.id.slice(-6).toUpperCase()}</strong> หรือไม่?</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button className="cursor-pointer" variant="outline" onClick={() => setDeleteComplaint(null)}>ยกเลิก</Button>
                            <Button className="cursor-pointer" variant="destructive" disabled={isDeleting} onClick={handleConfirmDeleteComplaint}>
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} ยืนยันลบ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            {
                <AlertDialog open={!!openReopenDialogId} onOpenChange={(open) => !open && setOpenReopenDialogId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันไม่ผ่านการตรวจสอบ</AlertDialogTitle>
                            <AlertDialogDescription>
                                โปรดระบุเหตุผลที่ “ไม่ผ่าน” หรือ “ต้องแก้ไข”
                            </AlertDialogDescription>
                            <Textarea
                                className="mt-2"
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="เหตุผล..."
                                autoFocus
                            />
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleReopen()}
                                className="cursor-pointer"
                            >
                                ยืนยัน
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            }
        </div>
    );
}
