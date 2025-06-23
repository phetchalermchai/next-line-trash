'use client'

import { useEffect, useState } from "react"
import axios from "axios"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const statusColor = {
  PENDING: "text-yellow-600 bg-yellow-100",
  APPROVED: "text-green-600 bg-green-100",
  BANNED: "text-red-600 bg-red-100",
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "ชื่อ",
    cell: ({ row }) => <span>{row.getValue("name")}</span>,
  },
  {
    accessorKey: "email",
    header: "อีเมล",
    cell: ({ row }) => <span>{row.getValue("email")}</span>,
  },
  {
    accessorKey: "role",
    header: "สิทธิ์",
    cell: ({ row }) => <Badge>{row.getValue("role")}</Badge>,
  },
  {
    accessorKey: "status",
    header: "สถานะ",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return <Badge variant={status === "APPROVED" ? "default" : "secondary"} className={cn("text-xs font-medium", statusColor[status as keyof typeof statusColor] || "")}>{status}</Badge>
    },
  },
  {
    id: "actions",
    header: "การดำเนินการ",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="cursor-pointer">อนุมัติ</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
              </DialogHeader>
              <p>คุณต้องการอนุมัติผู้ใช้นี้ใช่หรือไม่?</p>
              <DialogFooter>
                <Button className="cursor-pointer" onClick={() => handleApprove(user.id)}>ยืนยัน</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" className="cursor-pointer">ยกเลิก</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
              </DialogHeader>
              <p>คุณต้องการยกเลิกผู้ใช้นี้ใช่หรือไม่? ผู้ใช้จะถูกแบน</p>
              <DialogFooter>
                <Button variant="destructive" className="cursor-pointer" onClick={() => handleBan(user.id)}>ยืนยัน</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )
    },
  },
]

let handleApprove = async (id: string) => { }
let handleBan = async (id: string) => { }

const UserApprovalPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const { data: session } = useSession()
  const router = useRouter()

  const fetchPendingUsers = async () => {
    const res = await axios.get("/api/users/pending")
    setUsers(res.data)
  }

  handleApprove = async (id: string) => {
    await axios.post(`/api/users/${id}/approve`)
    toast.success("อนุมัติผู้ใช้เรียบร้อยแล้ว")
    fetchPendingUsers()
  }

  handleBan = async (id: string) => {
    await axios.post(`/api/users/${id}/ban`)
    toast.success("ยกเลิกอนุมัติผู้ใช้เรียบร้อยแล้ว")
    fetchPendingUsers()
  }

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      router.replace("/unauthorized")
      return
    }
    fetchPendingUsers()
  }, [session])

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="m-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">ผู้ใช้ที่รออนุมัติ</h2>
        <div className="rounded-md border overflow-x-auto">
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-6">
                    ไม่มีผู้ใช้ที่รออนุมัติ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default UserApprovalPage
