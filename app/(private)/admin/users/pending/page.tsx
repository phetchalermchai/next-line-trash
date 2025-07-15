"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ColumnDef, getCoreRowModel, useReactTable, flexRender, } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { X, Check, Trash2 } from "lucide-react";
import { roleVariants, statusColors } from "@/utils/userLabels";
import { useMediaQuery } from "@/lib/use-media-query";
import { PendingUserSkeleton, TableSkeleton } from "./Skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const PendingUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/users/pending");
      setUsers(res.data);
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      await axios.post(`/api/users/${id}/approve`);
      toast.success("อนุมัติผู้ใช้เรียบร้อยแล้ว");
      fetchPendingUsers();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setIsApproving(false);
    }
  };

  const handleBan = async (id: string) => {
    if (isBanning) return;
    setIsBanning(true);
    try {
      await axios.post(`/api/users/${id}/ban`);
      toast.success("ยกเลิกผู้ใช้เรียบร้อยแล้ว");
      fetchPendingUsers();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการแบน");
    } finally {
      setIsBanning(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);;

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
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant={roleVariants[role as keyof typeof roleVariants]}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            className={cn("text-xs font-medium", statusColors[status as keyof typeof statusColors])}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "การดำเนินการ",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex  gap-2">
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button className="cursor-pointer" size="icon" variant="ghost"><Check className="w-5 h-5 text-green-600 dark:text-green-300" /></Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>อนุมัติ</TooltipContent>
              </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
                </DialogHeader>
                <DialogDescription>คุณต้องการอนุมัติผู้ใช้นี้ใช่หรือไม่?</DialogDescription>
                <DialogFooter>
                  <Button className="cursor-pointer" onClick={() => handleApprove(user.id)} disabled={isApproving}>
                    ยืนยัน
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button className="cursor-pointer" size="icon" variant="ghost">
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>ยกเลิก</TooltipContent>
              </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
                </DialogHeader>
                <DialogDescription>คุณต้องการยกเลิกผู้ใช้นี้ใช่หรือไม่? ผู้ใช้จะถูกแบน</DialogDescription>
                <DialogFooter>
                  <Button className="cursor-pointer" variant="destructive" onClick={() => handleBan(user.id)}>ยืนยัน</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="m-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">ข้อมูลผู้ใช้งานที่รออนุมัติ</h2>

        {loading ? (
          isMobile ? <PendingUserSkeleton /> : <TableSkeleton columns={columns.length} />
        ) : (
          !isMobile ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="ps-5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
                      <TableCell colSpan={columns.length} className="text-center py-6">
                        ไม่มีผู้ใช้ที่รออนุมัติ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4">
              {users.length ? users.map(user => (
                <Card key={user.id}>
                  <CardContent className="space-y-2">
                    <CardTitle className="text-sm"><strong>ชื่อ:</strong> {user.name || "ไม่ระบุชื่อ"}</CardTitle>
                    <div className="text-sm"><strong>อีเมล:</strong> {user.email}</div>
                    <div className="text-sm flex gap-2">
                      <strong>สิทธิ์:</strong>
                      <Badge variant={roleVariants[user.role as keyof typeof roleVariants]}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="text-sm flex gap-2">
                      <strong>สถานะ:</strong>
                      <Badge className={cn("text-xs font-medium", statusColors[user.status as keyof typeof statusColors])}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button className="cursor-pointer" size="icon" variant="ghost"><Check className="w-5 h-5 text-green-600 dark:text-green-300" /></Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>อนุมัติ</TooltipContent>
                        </Tooltip>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
                          </DialogHeader>
                          <DialogDescription>คุณต้องการอนุมัติผู้ใช้นี้ใช่หรือไม่?</DialogDescription>
                          <DialogFooter>
                            <Button className="cursor-pointer" onClick={() => handleApprove(user.id)} disabled={isApproving}>ยืนยัน</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button className="cursor-pointer" size="icon" variant="ghost">
                                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>ยกเลิก</TooltipContent>
                        </Tooltip>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
                          </DialogHeader>
                          <DialogDescription>คุณต้องการยกเลิกผู้ใช้นี้ใช่หรือไม่? ผู้ใช้จะถูกแบน</DialogDescription>
                          <DialogFooter>
                            <Button className="cursor-pointer" variant="destructive" onClick={() => handleBan(user.id)} disabled={isBanning}>ยืนยัน</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-center text-gray-500">ไม่มีผู้ใช้ที่รออนุมัติ</p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PendingUsersPage;
