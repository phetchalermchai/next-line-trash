"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTheme } from "next-themes"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import axios from 'axios';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type StatusType = 'PENDING' | 'DONE' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | 'REOPENED';

interface StatusPie {
    status: StatusType;
    count: number;
}

const statusColorMap: Record<StatusType, string> = {
    PENDING: "#facc15", // เหลือง
    DONE: "#4ade80", // เขียว
    VERIFIED: "#2196f3", // น้ำเงิน
    REJECTED: "#ef4444", // แดง
    CANCELLED: "#6b7280", // เทา
    REOPENED: "#a21caf", // ม่วง
};

const statusLabelMap: Record<StatusType, string> = {
    PENDING: "รอดำเนินการ",
    DONE: "ดำเนินการแล้ว",
    VERIFIED: "ยืนยันผลแล้ว",
    REJECTED: "ไม่อนุมัติ",
    CANCELLED: "ยกเลิก",
    REOPENED: "ขอแก้ไข",
};

// ลำดับ status ที่ต้องการ
const chartStatuses: StatusType[] = [
    "PENDING", "DONE", "VERIFIED", "REJECTED", "CANCELLED", "REOPENED"
];

export default function StatusPieChart() {
    const [data, setData] = useState<StatusPie[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [quarter, setQuarter] = useState<string>('ALL');
    const [source, setSource] = useState<string>('ALL');
    const [loading, setLoading] = useState<boolean>(true);
    const { resolvedTheme } = useTheme();

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const quarters = ['ALL', 'Q1', 'Q2', 'Q3', 'Q4'];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const qParam = quarter === 'ALL' ? '' : `&quarter=${quarter}`;
                const srcParam = source === 'ALL' ? '' : `&source=${source}`;
                const res = await axios.get(`/api/complaints/dashboard/status-summary?year=${year}${qParam}${srcParam}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching StatusPieChart:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [year, quarter, source]);

    const series = chartStatuses.map(
        status => data.find(d => d.status === status)?.count || 0
    );
    const labels = chartStatuses.map(status => statusLabelMap[status]);
    const colors = chartStatuses.map(status => statusColorMap[status]);

    const options = {
        chart: {
            type: "donut" as const,
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
                    csv: { filename: 'status-summary' },
                    svg: { filename: 'status-summary' },
                    png: { filename: 'status-summary' },
                }
            },
            foreColor: resolvedTheme === "dark" ? "#e0e0e0" : "#333",
            background: resolvedTheme === 'dark' ? 'dark' : 'light'
        },
        labels,
        legend: {
            position: "bottom" as const,
            labels: {
                colors: resolvedTheme === "dark" ? "#bbb" : "#333"
            }
        },
        tooltip: {
            theme: resolvedTheme === "dark" ? "dark" : "light"
        },
        colors,
        dataLabels: {
            enabled: true,
            style: {
                colors: [resolvedTheme === "dark" ? "#fff" : "#000"]
            }
        },
        theme: { mode: (resolvedTheme === 'dark' ? 'dark' : 'light') as 'dark' | 'light' }
    };

    return (
        <Card className="@container/card transition-colors w-full">
            <CardHeader>
                <div className="flex flex-col gap-2 lg:justify-between lg:items-start">
                    <CardTitle className="text-base font-semibold">สัดส่วนสถานะเรื่องร้องเรียน</CardTitle>
                    <Tabs defaultValue="ALL" onValueChange={setSource} className="w-full lg:w-auto">
                        <TabsList className="flex items-center justify-start flex-wrap h-auto">
                            <TabsTrigger className='cursor-pointer' value="ALL">ALL</TabsTrigger>
                            <TabsTrigger className='cursor-pointer' value="LINE">LINE</TabsTrigger>
                            <TabsTrigger className='cursor-pointer' value="FACEBOOK">FACEBOOK</TabsTrigger>
                            <TabsTrigger className='cursor-pointer' value="PHONE">PHONE</TabsTrigger>
                            <TabsTrigger className='cursor-pointer' value="COUNTER">COUNTER</TabsTrigger>
                            <TabsTrigger className='cursor-pointer' value="OTHER">OTHER</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex flex-wrap gap-2">
                        <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                            <SelectTrigger className="w-[85px]">
                                <SelectValue placeholder="ปี" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>{y + 543}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={quarter} onValueChange={setQuarter}>
                            <SelectTrigger className="w-[80px]">
                                <SelectValue placeholder="ไตรมาส" />
                            </SelectTrigger>
                            <SelectContent>
                                {quarters.map((q) => (
                                    <SelectItem key={q} value={q}>{q}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="min-h-[300px]">
                {loading ? (
                    <Skeleton className="w-full h-[300px] rounded-xl" />
                ) : (
                    data.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">ไม่มีข้อมูล</p>
                    ) : (
                        <Chart
                            key={JSON.stringify(data) + resolvedTheme}
                            options={options}
                            series={series}
                            type="donut"
                            height={300}
                        />
                    )
                )}
            </CardContent>
        </Card>
    );
}