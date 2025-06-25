// file: app/(private)/admin/users/manage/page.tsx
"use client";

import * as React from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Info, Trash2, Pencil, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font as sarabunFont } from "@/utils/fonts/Sarabun-normal";
import { getExportFilename } from "@/utils/getExportFilename";
import { DatePickerWithRange } from "@/components/complaint/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/lib/use-media-query";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { roleVariants, statusColors } from "@/utils/userLabels";
import { formatThaiDatetime } from "@/utils/date";

if (!jsPDF.API.__sarabunFontLoaded) {
    jsPDF.API.__sarabunFontLoaded = true;
    jsPDF.API.events.push([
        "addFonts",
        function (this: jsPDF) {
            this.addFileToVFS("Sarabun-Regular.ttf", sarabunFont);
            this.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
        },
    ]);
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    accounts?: {
        id: string;
        provider: string;
    }[];
}

interface ManageUsersPageProps {
    initialStatus?: string;
}

export default function ManageUsersPage({ initialStatus = "ALL" }: ManageUsersPageProps) {
    const [users, setUsers] = React.useState<User[]>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [status, setStatus] = React.useState(initialStatus);
    const [role, setRole] = React.useState("ALL");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editUser, setEditUser] = React.useState<User | null>(null);
    const [viewUser, setViewUser] = React.useState<User | null>(null);
    const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
    const [pendingRole, setPendingRole] = React.useState<string | null>(null);
    const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);
    const [openDialogProviderId, setOpenDialogProviderId] = React.useState<string | null>(null);
    const [loadingExport, setLoadingExport] = React.useState(false);
    const [loadingFetch, setLoadingFetch] = React.useState(false);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deletingAccountId, setDeletingAccountId] = React.useState<string | null>(null);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const refreshUsers = async () => {
        setLoadingFetch(true);
        try {
            const params = new URLSearchParams();
            if (globalFilter) params.set("search", globalFilter);
            if (status) params.set("status", status);
            if (role) params.set("role", role);
            if (dateRange?.from) params.set("from", dateRange.from.toISOString());
            if (dateRange?.to) params.set("to", dateRange.to.toISOString());

            const res = await fetch(`/api/users?${params.toString()}`);
            const data = await res.json();
            setUsers(data.users);
            if (data.users.length === 0) {
                toast.info("ไม่พบผู้ใช้งานตามเงื่อนไข");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้");
        } finally {
            setLoadingFetch(false);
        }
    };

    React.useEffect(() => {
        refreshUsers();
    }, [globalFilter, dateRange, status, role]);

    const table = useReactTable({
        data: users,
        columns: [
            {
                accessorKey: "name",
                header: "ชื่อ",
            },
            {
                accessorKey: "email",
                header: "อีเมล",
            },
            {
                accessorKey: "role",
                header: "สิทธิ์",
                cell: ({ row }) => (
                    <Badge
                        variant={roleVariants[row.original.role as keyof typeof roleVariants]}
                        className="capitalize"
                    >
                        {row.original.role}
                    </Badge>
                ),
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: ({ row }) => {
                    const status = row.original.status;
                    const color = statusColors[status as keyof typeof statusColors] ?? "bg-gray-100 text-gray-800";
                    return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{status}</span>;
                },
            },
            {
                accessorKey: "createdAt",
                header: "วันที่สมัคร",
                cell: ({ row }) => formatThaiDatetime(row.original.createdAt),
            },
            {
                id: "actions",
                header: "การจัดการ",
                cell: ({ row }) => (
                    <div className="flex gap-2">
                        <Button className="cursor-pointer" size="icon" variant="outline" onClick={() => setViewUser(row.original)}><Info className="w-4 h-4" /></Button>
                        <Button className="cursor-pointer" size="icon" variant="outline" onClick={() => setEditUser(row.original)}><Pencil className="w-4 h-4" /></Button>
                        <Button className="cursor-pointer" size="icon" variant="destructive" onClick={() => setDeleteUser(row.original)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
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

    const handleConfirmDeleteUser = async () => {
        if (!deleteUser || isDeleting) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/users/${deleteUser.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("ลบผู้ใช้สำเร็จ");
                refreshUsers();
            } else {
                toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้");
            }
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิดในการลบผู้ใช้");
        } finally {
            setIsDeleting(false);
            setDeleteUser(null);
        }
    };

    const removeProvider = async (accountId: string) => {
        if (!editUser || deletingAccountId === accountId) return;
        if (!confirm("คุณต้องการลบบัญชีนี้หรือไม่?")) return;
        try {
            const res = await fetch(`/api/users/${editUser.id}/accounts/${accountId}`, { method: "DELETE" });
            if (!res.ok) {
                toast.error("ไม่สามารถลบบัญชีนี้ได้");
                return;
            }
            toast.success("ลบบัญชีเชื่อมต่อสำเร็จ");
            refreshUsers();
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการลบบัญชี");
        } finally {
            setDeletingAccountId(null);
        }
    };

    const updateRoleStatus = async () => {
        if (!editUser || isUpdating) return;
        setIsUpdating(true);

        const updatedRole = pendingRole ?? editUser.role;
        const updatedStatus = pendingStatus ?? editUser.status;

        const isChanged =
            updatedRole !== editUser.role || updatedStatus !== editUser.status;

        if (!isChanged) {
            setIsUpdating(false);
            return;
        }

        try {
            const res = await fetch(`/api/users/${editUser.id}/update`, {
                method: "PATCH",
                body: JSON.stringify({
                    role: updatedRole,
                    status: updatedStatus,
                }),
            });

            if (!res.ok) {
                toast.error("อัปเดตข้อมูลไม่สำเร็จ");
                return;
            }

            toast.success("อัปเดตข้อมูลสำเร็จ");
            refreshUsers();
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        } finally {
            setIsUpdating(false);
            setEditUser(null);
            setPendingRole(null);
            setPendingStatus(null);
        }
    };

    const handleExportExcel = async () => {
        setLoadingExport(true);
        try {
            const exportData = table.getFilteredRowModel().rows.map(({ original }) => ({
                ชื่อ: original.name,
                อีเมล: original.email,
                สิทธิ์: original.role,
                สถานะ: original.status,
                วันที่สมัคร: formatThaiDatetime(original.createdAt),
            }));

            const header = [
                ["รายงานข้อมูลผู้ใช้งาน"],
                [`สถานะ: ${status === "ALL" ? "ทั้งหมด" : status}`],
                [`สิทธิ์ผู้ใช้งาน: ${role === "ALL" ? "ทั้งหมด" : role}`],
                [
                    dateRange?.from && dateRange?.to
                        ? `ช่วงวันที่: ${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                        : "",
                ],
                [],
            ];

            const worksheet = XLSX.utils.json_to_sheet([]);
            XLSX.utils.sheet_add_aoa(worksheet, header, { origin: 0 });
            XLSX.utils.sheet_add_json(worksheet, exportData, { origin: -1 });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const data = new Blob([excelBuffer], { type: "application/octet-stream" });
            saveAs(data, getExportFilename({ type: "excel", status, dateRange, prefix: "ผู้ใช้งาน" }));
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการส่งออก Excel");
        } finally {
            setLoadingExport(false);
        }
    };

    const handleExportPDF = async () => {
        setLoadingExport(true);
        try {
            const doc = new jsPDF();
            doc.setFont("Sarabun", "normal");
            doc.setFontSize(10);
            doc.text("รายชื่อผู้ใช้งาน", 14, 20);
            let y = 26;

            doc.text(`สถานะ: ${status === "ALL" ? "ทั้งหมด" : status}`, 14, y); y += 6;
            doc.text(`สิทธิ์ผู้ใช้งาน: ${role === "ALL" ? "ทั้งหมด" : role}`, 14, y); y += 6;
            if (dateRange?.from && dateRange?.to) {
                const from = format(dateRange.from, "dd/MM/yyyy");
                const to = format(dateRange.to, "dd/MM/yyyy");
                doc.text(`ช่วงเวลา: ${from} - ${to}`, 14, y); y += 6;
            }

            autoTable(doc, {
                startY: y + 2,
                head: [["ชื่อ", "อีเมล", "สิทธิ์", "สถานะ", "วันที่สมัคร"]],
                body: table.getFilteredRowModel().rows.map(({ original }) => [
                    original.name,
                    original.email,
                    original.role,
                    original.status,
                    formatThaiDatetime(original.createdAt),
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

            doc.save(getExportFilename({ type: "pdf", status, dateRange, prefix: "ผู้ใช้งาน" }));
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการส่งออก PDF");
        } finally {
            setLoadingExport(false);
        }
    };

    return (
        <div className="space-y-4 m-6">
            <h2 className="text-xl font-bold">ค้นหาข้อมูลผู้ใช้งาน</h2>
            <div className="flex flex-wrap gap-2 items-center">
                <Input
                    placeholder="ค้นหาชื่อหรืออีเมล..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <div className="w-full md:w-auto max-w-sm grow">
                    <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                </div>
                <div className="flex gap-2 items-center">
                    <Select onValueChange={setStatus} value={status}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="สถานะ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">ทั้งหมด</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="BANNED">Banned</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setRole} value={role}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="สิทธิ์" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">ทั้งหมด</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                <Button className="cursor-pointer" onClick={handleExportExcel} disabled={loadingExport}>{loadingExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Export Excel</Button>
                <Button className="cursor-pointer" onClick={handleExportPDF} disabled={loadingExport} variant="outline">{loadingExport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Export PDF</Button>
            </div>
            {loadingFetch ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                !isMobile ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="ps-5">
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="ps-5">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
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
                            table.getRowModel().rows.map((row) => (
                                <div key={row.id} className="rounded border p-4 shadow">
                                    {row.getVisibleCells().map((cell) => (
                                        <div key={cell.id} className="mb-1">
                                            <strong>{cell.column.id}: </strong>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </div>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
                        )}
                    </div>
                )
            )}
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    ก่อนหน้า
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    ถัดไป
                </Button>
            </div>
            {viewUser && (
                <Drawer direction={isMobile ? "bottom" : "right"} open={!!viewUser} onOpenChange={() => setViewUser(null)}>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>ข้อมูลผู้ใช้งาน</DrawerTitle>
                            <DrawerDescription>แสดงรายละเอียดบัญชีผู้ใช้งาน</DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 py-2 space-y-4 text-sm">
                            <div><strong>ชื่อ:</strong> {viewUser.name}</div>
                            <div><strong>อีเมล:</strong> {viewUser.email}</div>
                            <div className="flex items-center gap-2">
                                <strong>สิทธิ์ผู้ใช้งาน:</strong>
                                <Badge variant={roleVariants[viewUser.role as keyof typeof roleVariants]}>
                                    {viewUser.role}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <strong>สถานะ:</strong>
                                <Badge className={statusColors[viewUser.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>{viewUser.status}</Badge>
                            </div>
                            <div><strong>วันที่สมัคร:</strong> {formatThaiDatetime(viewUser.createdAt)} </div>
                            <div>
                                <strong>บัญชีที่เชื่อมต่อ:</strong>
                                <ul className="list-disc pl-6 mt-1 space-y-1">
                                    {viewUser.accounts && viewUser.accounts.length > 0 ? (
                                        viewUser.accounts.map((acc) => {
                                            const brandStyles: Record<string, string> = {
                                                google: "bg-red-100 text-red-800",
                                                facebook: "bg-blue-100 text-blue-800",
                                                line: "bg-green-100 text-green-800",
                                            };
                                            const defaultStyle = "bg-gray-100 text-gray-800";
                                            const style = brandStyles[acc.provider] || defaultStyle;

                                            return (
                                                <li key={acc.id} className="my-2">
                                                    <Badge className={`capitalize ${style} px-2 py-1 text-xs font-medium`}>
                                                        {acc.provider}
                                                    </Badge>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-muted-foreground text-sm">ไม่มีบัญชีที่เชื่อมต่อ</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
            {editUser && (
                <Drawer direction={isMobile ? "bottom" : "right"} open={!!editUser} onOpenChange={() => setEditUser(null)}>
                    <DrawerContent>
                        <DrawerHeader className="gap-1">
                            <DrawerTitle>แก้ไขผู้ใช้</DrawerTitle>
                            <DrawerDescription>คุณสามารถแก้ไขสิทธิ์หรือสถานะของผู้ใช้นี้ได้จากด้านล่าง</DrawerDescription>
                            <div className="space-y-2 my-2">
                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="role">สิทธิ์ผู้ใช้งาน</Label>
                                    <Select value={pendingRole ?? editUser.role} onValueChange={(v) => setPendingRole(v)}>
                                        <SelectTrigger className="w-full" id="role"><SelectValue placeholder="Role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="status">สถานะ</Label>
                                    <Select value={pendingStatus ?? editUser.status} onValueChange={(v) => setPendingStatus(v)}>
                                        <SelectTrigger className="w-full" id="status"><SelectValue placeholder="Status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="APPROVED">Approved</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="BANNED">Banned</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Separator className="my-5" />
                                <div className="flex flex-col gap-3 my-5">
                                    <span className="text-sm text-start">บัญชีที่เชื่อมต่อ</span>
                                    <ul className="space-y-2">
                                        {editUser.accounts && editUser.accounts.length > 0 ? (
                                            editUser.accounts.map((acc) => (
                                                <li key={acc.id} className="flex justify-between items-center">
                                                    <span className="capitalize">{acc.provider}</span>
                                                    <Dialog open={openDialogProviderId === acc.id} onOpenChange={(open) => {
                                                        if (!open) setOpenDialogProviderId(null);
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                className="cursor-pointer"
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={deletingAccountId === acc.id}
                                                                onClick={() => setOpenDialogProviderId(acc.id)}
                                                            >
                                                                {deletingAccountId === acc.id && <Loader2 className="w-4 h-4 animate-spin mr-1" />} ถอดบัญชี
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>ยืนยันการลบบัญชี {acc.provider}</DialogTitle>
                                                                <p>คุณแน่ใจว่าต้องการลบบัญชีนี้หรือไม่?</p>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <Button className="cursor-pointer" variant="outline" onClick={() => setOpenDialogProviderId(null)}>ยกเลิก</Button>
                                                                <Button className="cursor-pointer" variant="destructive" onClick={() => {
                                                                    removeProvider(acc.id);
                                                                    setOpenDialogProviderId(null);
                                                                }}>ลบ</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-muted-foreground text-sm">ไม่มีบัญชีที่เชื่อมต่อ</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="flex justify-end gap-2 my-5">
                                    <Button className="cursor-pointer" variant="outline" onClick={() => setEditUser(null)}>ยกเลิก</Button>
                                    <Button className="cursor-pointer" onClick={updateRoleStatus} disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="w-4 h-4 animate-spin mr-2" />} ยืนยัน
                                    </Button>
                                </div>
                            </div>
                        </DrawerHeader>
                    </DrawerContent>
                </Drawer>
            )}
            {deleteUser && (
                <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
                            <p>คุณต้องการลบผู้ใช้ <strong>{deleteUser.name || deleteUser.email}</strong> หรือไม่?</p>
                        </DialogHeader>
                        <DialogFooter>
                            <Button className="cursor-pointer" variant="outline" onClick={() => setDeleteUser(null)}>ยกเลิก</Button>
                            <Button className="cursor-pointer" variant="destructive" disabled={isDeleting} onClick={handleConfirmDeleteUser}>
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} ลบ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
