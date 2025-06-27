"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, UserCheck, UserX, Shield, Download, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "next-themes";
import { roleVariants, statusColors } from "@/utils/userLabels";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { font as sarabunFont } from "@/utils/fonts/Sarabun-normal";
import { ChartSkeleton, RecentUserSkeleton, SummaryCardSkeleton } from "./Skeleton";

// Lazy load ApexCharts
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function formatThaiDateWithBE(dateStr: string) {
    const date = new Date(dateStr);
    const formatted = format(date, "dd MMM", { locale: th });
    const buddhistYear = date.getFullYear() + 543;
    return `${formatted} ${buddhistYear}`;
}

export default function UserDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get("/api/users/dashboard");
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch dashboard", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleExportPDF = () => {
        setExporting(true);
        try {
            const doc = new jsPDF();
            doc.addFileToVFS("Sarabun.ttf", sarabunFont);
            doc.addFont("Sarabun.ttf", "Sarabun", "normal");
            doc.setFont("Sarabun");
            doc.setFontSize(10);
            doc.text("ข้อมูลผู้ใช้งาน (5 รายการล่าสุด)", 14, 20);
            let y = 24;
            autoTable(doc, {
                startY: y + 2,
                head: [["ชื่อ", "อีเมล", "Role", "Status", "วันที่สมัคร"]],
                body: data.recentUsers.map((user: any) => [
                    user.name || "ไม่มีชื่อ",
                    user.email,
                    user.role,
                    user.status,
                    formatThaiDateWithBE(user.createdAt),
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
            doc.save("recent-users.pdf");
        } catch (error) {
            console.error("Export PDF failed", error);
        } finally {
            setExporting(false);
        }
    };

    const handleExportExcel = () => {
        setExporting(true);
        try {

            const worksheetData = data.recentUsers.map((user: any) => [
                user.name || "ไม่มีชื่อ",
                user.email,
                user.role,
                user.status,
                formatThaiDateWithBE(user.createdAt),
            ]);

            const ws = XLSX.utils.aoa_to_sheet([
                ["รายงานข้อมูลผู้ใช้งานล่าสุด (5 รายการ)", "", "", "", ""],
                ["ชื่อ", "อีเมล", "Role", "Status", "วันที่สมัคร"],
                ...worksheetData,
            ]);

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Users");

            const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(new Blob([wbout], { type: "application/octet-stream" }), "recent-users.xlsx");
        } catch (error) {
            console.error("Export Excel failed", error);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <SummaryCardSkeleton key={i} />)}
                </div>

                {/* Charts */}
                <ChartSkeleton title="จำนวนผู้ใช้ใหม่ต่อเดือน" />
                <ChartSkeleton title="ผู้ใช้ตามบทบาท (Role)" />
                <ChartSkeleton title="บัญชีที่เชื่อมต่อ OAuth" />

                {/* Recent user list */}
                <RecentUserSkeleton />
            </div>
        );
    }

    const isDark = resolvedTheme === "dark";
    const tooltipTheme = isDark ? "dark" : "light";
    const foreColor = isDark ? "#e4e4e7" : "#0f172a";
    const mutedColor = isDark ? "#a1a1aa" : "#475569";

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">แดชบอร์ดผู้ใช้งาน</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={<Users />} label="ผู้ใช้ทั้งหมด" value={data.totalUsers} />
                <SummaryCard icon={<UserCheck />} label="ผ่านการอนุมัติ" value={data.approvedUsers} />
                <SummaryCard icon={<User />} label="รออนุมัติ" value={data.pendingUsers} />
                <SummaryCard icon={<UserX />} label="ถูกระงับ" value={data.bannedUsers} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={<Shield />} label="SUPERADMIN" value={data.superadminUsers} />
                <SummaryCard icon={<Shield />} label="ADMIN" value={data.adminUsers} />
                <SummaryCard icon={<Users />} label="สมัครใหม่เดือนนี้" value={data.newUsersThisMonth} />
            </div>

            {/* Signup Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>จำนวนผู้ใช้ใหม่ต่อเดือน</CardTitle>
                </CardHeader>
                <CardContent>
                    <ApexChart
                        type="area"
                        height={300}
                        options={{
                            chart: {
                                id: "signup-trend",
                                toolbar: {
                                    show: true,
                                    tools: {
                                        download: true,
                                        selection: false,
                                        zoom: false,
                                        zoomin: false,
                                        zoomout: false,
                                        pan: false,
                                        reset: false,
                                    },
                                    export: {
                                        csv: {
                                            filename: "signup-trend",
                                            headerCategory: "บทบาท",
                                            headerValue: "จำนวนผู้ใช้",
                                        },
                                        svg: {
                                            filename: "signup-trend",
                                        },
                                        png: {
                                            filename: "signup-trend",
                                        },
                                    }
                                },
                                foreColor,
                            },
                            xaxis: {
                                categories: data.signupTrend.map((d: any) => d.month),
                                labels: { style: { colors: mutedColor } },
                            },
                            colors: ["#4f46e5"],
                            tooltip: { theme: tooltipTheme },
                        }}
                        series={[{ name: "ผู้ใช้ใหม่", data: data.signupTrend.map((d: any) => d.count) }]}
                    />
                </CardContent>
            </Card>

            {/* Role Distribution Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>ผู้ใช้ตามบทบาท (Role)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ApexChart
                        type="bar"
                        height={300}
                        options={{
                            chart: {
                                toolbar: {
                                    show: true,
                                    tools: {
                                        download: true,
                                        selection: false,
                                        zoom: false,
                                        zoomin: false,
                                        zoomout: false,
                                        pan: false,
                                        reset: false,
                                    },
                                    export: {
                                        csv: {
                                            filename: "role-distribution",
                                            headerCategory: "บทบาท",
                                            headerValue: "จำนวนผู้ใช้",
                                        },
                                        svg: {
                                            filename: "role-distribution",
                                        },
                                        png: {
                                            filename: "role-distribution",
                                        },
                                    }
                                },
                                foreColor
                            },
                            xaxis: { categories: ["ADMIN", "SUPERADMIN"] },
                            colors: ["#16a34a", "#2563eb"],
                            plotOptions: {
                                bar: {
                                    distributed: true,
                                    borderRadius: 4,
                                },
                            },
                            tooltip: { theme: tooltipTheme },
                        }}
                        series={[{ name: "จำนวน", data: [data.adminUsers, data.superadminUsers] }]}
                    />
                </CardContent>
            </Card>

            {/* Provider Pie Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>บัญชีที่เชื่อมต่อ OAuth</CardTitle>
                </CardHeader>
                <CardContent>
                    <ApexChart
                        type="pie"
                        height={300}
                        options={{
                            labels: data.providers.map((p: any) => p.provider),
                            legend: {
                                labels: {
                                    colors: mutedColor
                                }
                            },
                            chart: {
                                foreColor,
                                toolbar: {
                                    show: true,
                                    tools: {
                                        download: true,
                                        selection: false,
                                        zoom: false,
                                        zoomin: false,
                                        zoomout: false,
                                        pan: false,
                                        reset: false,
                                    },
                                    export: {
                                        csv: {
                                            filename: "role-distribution",
                                            headerCategory: "บทบาท",
                                            headerValue: "จำนวนผู้ใช้",
                                        },
                                        svg: {
                                            filename: "role-distribution",
                                        },
                                        png: {
                                            filename: "role-distribution",
                                        },
                                    }
                                }
                            },
                            tooltip: { theme: tooltipTheme },
                        }}
                        series={data.providers.map((p: any) => p.count)}
                    />
                </CardContent>
            </Card>

            {/* Warning for users without account */}
            {data.usersWithoutLinkedAccount?.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>พบผู้ใช้ที่ไม่มีบัญชี OAuth เชื่อมต่อ</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                            {data.usersWithoutLinkedAccount.map((user: any) => (
                                <li key={user.id} className="text-sm">
                                    {user.email || "ไม่มีอีเมล"}
                                </li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Recent Users */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row gap-2 justify-between">
                        <div>
                            <CardTitle>
                                ผู้ใช้ที่ลงทะเบียนล่าสุด (5 คน)
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                                แสดงรายชื่อผู้ใช้ที่เพิ่งสมัครเข้าใช้งานล่าสุดเรียงตามวันที่
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button className="cursor-pointer" onClick={handleExportExcel} disabled={exporting}>
                                <Download className="w-4 h-4 mr-2" />
                                {exporting ? "กำลัง Export..." : "Export Excel"}
                            </Button>
                            <Button className="cursor-pointer" onClick={handleExportPDF} disabled={exporting} variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                {exporting ? "กำลัง Export..." : "Export PDF"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {data.recentUsers.map((user: any) => (
                        <div key={user.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">ชื่อ: {user.name || "ไม่มีชื่อ"}</p>
                                <p className="text-sm text-muted-foreground">อีเมล: {user.email || "ไม่มีอีเมล"}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant={roleVariants[user.role as keyof typeof roleVariants]}>
                                        {user.role}
                                    </Badge>
                                    <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>
                            <Badge>{formatThaiDateWithBE(user.createdAt)}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-4">
                <div className="p-2 rounded-full bg-muted text-primary shrink-0">{icon}</div>
                <div className="min-w-0">
                    <div className="text-sm text-muted-foreground truncate">{label}</div>
                    <div className="text-2xl font-bold break-words">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}
