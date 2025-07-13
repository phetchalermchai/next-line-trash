"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useReactTable, ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, getSortedRowModel } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatThaiDatetime } from "@/utils/date"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/complaint/DatePickerWithRange"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/lib/use-media-query"
import { Card, CardContent } from "@/components/ui/card"

const ZoneFormCreate = dynamic(() => import("./ZoneFormCreate"), { ssr: false })
const ZoneFormEdit = dynamic(() => import("./ZoneFormEdit"), { ssr: false })

interface Zone {
    id: string
    name: string
    createdAt: string
    updatedAt: string
}

interface ZoneTableProps {
    zones: Zone[]
    onEdit: (zone: Zone) => void
    onDelete: (id: string) => void
    onDeleteMany: (ids: string[]) => void
    onView: (zone: Zone) => void
    open: boolean
    setOpen: (val: boolean) => void
    editMode: boolean
    setEditMode: (val: boolean) => void
    initialData: any
    setInitialData: (val: any) => void
    handleCreate: (data: any) => void
    handleUpdate: (data: any) => void
}

export default function ZoneTable({ zones, onEdit, onDelete, onDeleteMany, onView, open, setOpen, editMode, setEditMode, initialData, setInitialData, handleCreate, handleUpdate }: ZoneTableProps) {
    const [globalFilter, setGlobalFilter] = useState("")
    const [dateRange, setDateRange] = useState<any>()
    const isMobile = useMediaQuery("(max-width: 768px)")

    const filteredZones = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return zones
        const from = new Date(dateRange.from).setHours(0, 0, 0, 0)
        const to = new Date(dateRange.to).setHours(23, 59, 59, 999)
        return zones.filter(zone => {
            const d = new Date(zone.createdAt).getTime()
            return d >= from && d <= to
        })
    }, [zones, dateRange])

    const columns = useMemo<ColumnDef<Zone>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                    />
                ),
                size: 10,
            },
            {
                accessorKey: "name",
                header: "ชื่อพื้นที่โซน",
                cell: ({ row }) => row.getValue("name"),
            },
            {
                accessorKey: "createdAt",
                header: "วันที่บันทึก",
                cell: ({ row }) => formatThaiDatetime(row.getValue("createdAt")),
            },
            {
                accessorKey: "updatedAt",
                header: "อัปเดตล่าสุด",
                cell: ({ row }) => formatThaiDatetime(row.getValue("updatedAt")),
            },
            {
                id: "actions",
                header: "การจัดการ",
                cell: ({ row }) => (
                    <div className="flex gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={() => onView(row.original)} className="cursor-pointer">
                                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>ดูรายละเอียด</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="cursor-pointer"
                                    onClick={() => {
                                        onEdit(row.original)
                                        setEditMode(true)
                                        setOpen(true)
                                    }}
                                >
                                    <Pencil className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>แก้ไขพื้นที่โซน</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="cursor-pointer">
                                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>ยืนยันการลบโซนนี้?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                คุณแน่ใจหรือไม่ว่าต้องการลบ <b>{row.original.name}</b> โซนนี้จะถูกลบถาวร!
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="cursor-pointer">ยกเลิก</AlertDialogCancel>
                                            <AlertDialogAction className="cursor-pointer" onClick={() => onDelete(row.original.id)}>ยืนยันลบ</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TooltipTrigger>
                            <TooltipContent>ลบพื้นที่โซน</TooltipContent>
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [onEdit, onDelete, onView, setEditMode, setOpen]
    )

    const table = useReactTable({
        data: filteredZones,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableRowSelection: true,
    })

    const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id)

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
                <Input placeholder="ค้นหา (เช่น ชื่อพื้นที่โซน)..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full sm:max-w-sm" />
                <div className="w-full md:w-auto sm:max-w-sm grow">
                    <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                </div>
            </div>
            <div className="flex justify-between items-center">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="cursor-pointer" variant="destructive" disabled={selectedIds.length === 0}>
                            ลบทั้งหมด
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบโซนที่เลือก?</AlertDialogTitle>
                            <AlertDialogDescription>
                                คุณแน่ใจหรือไม่ว่าต้องการลบ <b>{selectedIds.length}</b> โซนที่เลือก? รายการเหล่านี้จะถูกลบถาวร!
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction className="cursor-pointer" onClick={() => onDeleteMany(selectedIds)}>ลบทั้งหมด</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Dialog
                    open={open}
                    onOpenChange={(v) => {
                        setOpen(v)
                        if (!v) {
                            setEditMode(false)
                            setInitialData(null)
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button className="cursor-pointer">+ เพิ่มโซน</Button>
                    </DialogTrigger>
                    <DialogContent className="w-full !max-w-7xl">
                        <DialogHeader>
                            <DialogTitle>{editMode ? "แก้ไขพื้นที่โซน" : "เพิ่มพื้นที่โซน"}</DialogTitle>
                            <DialogDescription className="sr-only"></DialogDescription>
                        </DialogHeader>
                        {editMode && initialData ? (
                            <ZoneFormEdit
                                onSubmit={handleUpdate}
                                initialData={{
                                    name: initialData.name,
                                    lineGroupId: initialData.lineGroupId,
                                    telegramGroupId: initialData.telegramGroupId,
                                    polygon: initialData.polygon,
                                }}
                            />
                        ) : (
                            <ZoneFormCreate onSubmit={handleCreate} />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
            {isMobile && (
                <div className="flex items-center justify-end gap-2 mb-2">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={val => table.toggleAllPageRowsSelected(!!val)}
                        aria-label="เลือกทั้งหมด"
                    />
                    <span className="text-sm text-muted-foreground">เลือกทั้งหมด</span>
                </div>
            )}
            {isMobile ? (
                <div className="grid grid-cols-1 gap-4">
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <Card key={row.id} className="shadow relative">
                                <CardContent className="pt-2 space-y-2">
                                    <div className="absolute top-2 right-3 z-10">
                                        <Checkbox
                                            checked={row.getIsSelected()}
                                            onCheckedChange={(val) => row.toggleSelected(!!val)}
                                        />
                                    </div>
                                    {/* กรองคอลัมน์ที่ไม่ต้องแสดงใน Card */}
                                    {row.getVisibleCells()
                                        .filter(cell =>
                                            cell.column.id !== "select" && cell.column.id !== "actions"
                                        )
                                        .map((cell) => (
                                            <div key={cell.id} className="text-sm">
                                                <strong>{String(cell.column.columnDef.header)}:</strong>{" "}
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </div>
                                        ))}
                                    {/* เพิ่ม action ปุ่มต่าง ๆ ด้านล่างของ Card */}
                                    <div className="flex gap-2 pt-2">
                                        <Button className="cursor-pointer" size="icon" variant="ghost" onClick={() => onView(row.original)}><Eye className="w-4 h-4 text-blue-600" /></Button>
                                        <Button className="cursor-pointer" size="icon" variant="ghost" onClick={() => { onEdit(row.original); setEditMode(true); setOpen(true); }}><Pencil className="w-4 h-4 text-yellow-600" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button className="cursor-pointer" size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>ยืนยันการลบโซนนี้?</AlertDialogTitle>
                                                    <AlertDialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบ <b>{row.original.name}</b> โซนนี้จะถูกลบถาวร!</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(row.original.id)}>ยืนยันลบ</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
                    )}
                </div>
            ) : (
                <div className="border rounded-md overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="ps-5 last:ps-12">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="ps-5">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mt-4">
                <div className="hidden lg:block text-sm text-muted-foreground">
                    {selectedIds.length} จาก {zones.length} รายการถูกเลือก
                </div>
                <div className="flex flex-row lg:items-center gap-2 lg:gap-4 w-full lg:w-auto justify-between">
                    <div className="hidden lg:flex justify-center items-center gap-2">
                        <span className="text-sm">แสดง:</span>
                        <Select value={table.getState().pagination.pageSize.toString()} onValueChange={(val) => table.setPageSize(Number(val))}>
                            <SelectTrigger className="w-[80px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map((val) => (
                                    <SelectItem key={val} value={val.toString()}>{val}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-sm">รายการ</span>
                    </div>
                    <div className="flex justify-center items-center gap-2">
                        <span className="text-sm">หน้า {table.getState().pagination.pageIndex + 1} จาก {table.getPageCount()}</span>
                    </div>
                    <div className="inline-flex justify-center gap-1">
                        <Button variant="outline" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
