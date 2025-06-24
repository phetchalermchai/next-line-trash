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
import { Download, Info, Trash2, Pencil } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font as sarabunFont } from "@/utils/fonts/Sarabun-normal";
import { getExportFilename } from "@/utils/getExportFilename";
import { DatePickerWithRange } from "@/components/complaint/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { th } from "date-fns/locale";
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

export default function ManageUsersPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [status, setStatus] = React.useState("ALL");
    const [role, setRole] = React.useState("ALL");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editUser, setEditUser] = React.useState<User | null>(null);
    const [viewUser, setViewUser] = React.useState<User | null>(null);
    const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
    const [pendingRole, setPendingRole] = React.useState<string | null>(null);
    const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const refreshUsers = async () => {
        const params = new URLSearchParams();
        if (globalFilter) params.set("search", globalFilter);
        if (status) params.set("status", status);
        if (role) params.set("role", role);
        if (dateRange?.from) params.set("from", dateRange.from.toISOString());
        if (dateRange?.to) params.set("to", dateRange.to.toISOString());

        const res = await fetch(`/api/users?${params.toString()}`);
        const data = await res.json();
        setUsers(data.users);
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
                    <Badge variant="outline" className="capitalize">
                        {row.original.role}
                    </Badge>
                ),
            },
            {
                accessorKey: "status",
                header: "สถานะ",
                cell: ({ row }) => {
                    const status = row.original.status;
                    const color =
                        status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800";
                    return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{status}</span>;
                },
            },
            {
                accessorKey: "createdAt",
                header: "วันที่สมัคร",
                cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: th }),
            },
            {
                id: "actions",
                header: "การจัดการ",
                cell: ({ row }) => (
                    <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => setViewUser(row.original)}><Info className="w-4 h-4" /></Button>
                        <Button size="icon" variant="outline" onClick={() => setEditUser(row.original)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="destructive" onClick={() => setDeleteUser(row.original)}><Trash2 className="w-4 h-4" /></Button>
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
        if (!deleteUser) return;
        const res = await fetch(`/api/users/${deleteUser.id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("ลบผู้ใช้สำเร็จ");
            refreshUsers();
        } else {
            toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้");
        }
        setDeleteUser(null);
    };

    const removeProvider = async (accountId: string) => {
        if (!editUser) return;
        if (!confirm("คุณต้องการลบบัญชีนี้หรือไม่?")) return;
        await fetch(`/api/users/${editUser.id}/accounts/${accountId}`, { method: "DELETE" });
        refreshUsers();
    };

    const updateRoleStatus = async () => {
        if (!editUser || !pendingRole || !pendingStatus) return;
        await fetch(`/api/users/${editUser.id}/update`, {
            method: "PATCH",
            body: JSON.stringify({ role: pendingRole, status: pendingStatus }),
        });
        refreshUsers();
        setEditUser(null);
        setPendingRole(null);
        setPendingStatus(null);
    };

    const handleExportExcel = () => {
        const exportData = table.getFilteredRowModel().rows.map(({ original }) => ({
            ชื่อ: original.name,
            อีเมล: original.email,
            สิทธิ์: original.role,
            สถานะ: original.status,
            วันที่สมัคร: format(new Date(original.createdAt), "dd/MM/yyyy"),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buf]), getExportFilename("excel", status || "ALL", dateRange));
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFont("Sarabun", "normal");
        doc.text("รายชื่อผู้ใช้งาน", 14, 20);

        autoTable(doc, {
            startY: 30,
            head: [["ชื่อ", "อีเมล", "สิทธิ์", "สถานะ", "วันที่สมัคร"]],
            body: table.getFilteredRowModel().rows.map(({ original }) => [
                original.name,
                original.email,
                original.role,
                original.status,
                format(new Date(original.createdAt), "dd/MM/yyyy"),
            ]),
            styles: { font: "Sarabun", fontSize: 10 },
        });

        doc.save(getExportFilename("pdf", status || "ALL", dateRange));
    };

    return (
        <div className="space-y-4 m-6">
            <div className="flex flex-wrap gap-2 items-center">
                <Input
                    placeholder="ค้นหาชื่อหรืออีเมล..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <div className="w-full md:w-auto max-w-xs">
                    <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                </div>
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
                <Button onClick={handleExportExcel}><Download className="mr-2 h-4 w-4" />Export Excel</Button>
                <Button onClick={handleExportPDF} variant="outline"><Download className="mr-2 h-4 w-4" />Export PDF</Button>
            </div>

            {!isMobile ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
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
                                            <TableCell key={cell.id}>
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
                    {table.getRowModel().rows.map((row) => (
                        <div key={row.id} className="rounded border p-4 shadow">
                            {row.getVisibleCells().map((cell) => (
                                <div key={cell.id} className="mb-1">
                                    <strong>{cell.column.id}: </strong>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                            ))}
                        </div>
                    ))}
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
            {viewUser && (
                <Drawer direction={isMobile ? "bottom" : "right"} open={!!viewUser} onOpenChange={() => setViewUser(null)}>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>ข้อมูลผู้ใช้</DrawerTitle>
                            <DrawerDescription>
                                <p><strong>ชื่อ:</strong> {viewUser.name}</p>
                                <p><strong>อีเมล:</strong> {viewUser.email}</p>
                                <p><strong>สิทธิ์:</strong> {viewUser.role}</p>
                                <p><strong>สถานะ:</strong> {viewUser.status}</p>
                                <p><strong>วันที่สมัคร:</strong> {format(new Date(viewUser.createdAt), "dd MMM yyyy", { locale: th })}</p>
                                <p><strong>บัญชีที่เชื่อมต่อ:</strong></p>
                                <ul className="list-disc pl-4">
                                    {viewUser.accounts?.map((acc) => (
                                        <li key={acc.id}>{acc.provider}</li>
                                    )) || <li>ไม่มีบัญชีที่เชื่อมต่อ</li>}
                                </ul>
                            </DrawerDescription>
                        </DrawerHeader>
                    </DrawerContent>
                </Drawer>
            )}
            {editUser && (
                <Drawer direction={isMobile ? "bottom" : "right"} open={!!editUser} onOpenChange={() => setEditUser(null)}>
                    <DrawerContent>
                        <DrawerHeader className="gap-1">
                            <DrawerTitle>แก้ไขผู้ใช้</DrawerTitle>
                            <DrawerDescription>This action cannot be undone.</DrawerDescription>
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
                                <div className="flex flex-col gap-3 my-5">
                                    <span className="text-sm text-start">บัญชีที่เชื่อมต่อ</span>
                                    <ul className="space-y-2">
                                        {editUser.accounts?.map((acc) => (
                                            <li key={acc.id} className="flex justify-between items-center">
                                                <span className="capitalize">{acc.provider}</span>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="destructive">ถอดบัญชี</Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>ยืนยันการลบบัญชี {acc.provider}</DialogTitle>
                                                            <p>คุณแน่ใจว่าต้องการลบบัญชีนี้หรือไม่?</p>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button variant="outline" >ยกเลิก</Button>
                                                            <Button variant="destructive" onClick={() => removeProvider(acc.id)}>ลบ</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </li>
                                        )) || <li>ไม่มีบัญชี</li>}
                                    </ul>
                                </div>
                                <div className="flex justify-end gap-2 my-5">
                                    <Button variant="outline" onClick={() => setEditUser(null)}>ยกเลิก</Button>
                                    <Button onClick={updateRoleStatus}>ยืนยัน</Button>
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
                            <Button variant="outline" onClick={() => setDeleteUser(null)}>ยกเลิก</Button>
                            <Button variant="destructive" onClick={handleConfirmDeleteUser}>ลบ</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
