"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import axios from 'axios';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type StatusType = 'PENDING' | 'DONE' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | 'REOPENED';

interface MonthlyStatus {
    month: number;
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

const chartStatuses: StatusType[] = [
    "PENDING", "DONE", "VERIFIED", "REJECTED", "CANCELLED", "REOPENED"
];

const MonthlyStatusChart = () => {
    const [data, setData] = useState<MonthlyStatus[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [quarter, setQuarter] = useState<string>('ALL');
    const [source, setSource] = useState('ALL');
    const [loading, setLoading] = useState<boolean>(true);
    const { resolvedTheme } = useTheme();

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const quarters = ['ALL', 'Q1', 'Q2', 'Q3', 'Q4'];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const srcParam = source === 'ALL' ? '' : `&source=${source}`;
                const qParam = quarter === 'ALL' ? '' : `&quarter=${quarter}`;
                const res = await axios.get(`/api/complaints/dashboard/monthly-status?year=${year}${srcParam}${qParam}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching MonthlyStatusChart:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [source, year, quarter]);

    let monthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    if (quarter === 'Q1') monthLabels = ["ม.ค.", "ก.พ.", "มี.ค."];
    else if (quarter === 'Q2') monthLabels = ["เม.ย.", "พ.ค.", "มิ.ย."];
    else if (quarter === 'Q3') monthLabels = ["ก.ค.", "ส.ค.", "ก.ย."];
    else if (quarter === 'Q4') monthLabels = ["ต.ค.", "พ.ย.", "ธ.ค."];

    const grouped: Record<StatusType, number[]> = {
        PENDING: Array(12).fill(0),
        DONE: Array(12).fill(0),
        VERIFIED: Array(12).fill(0),
        REJECTED: Array(12).fill(0),
        CANCELLED: Array(12).fill(0),
        REOPENED: Array(12).fill(0),
    };

    data.forEach(({ month, status, count }) => {
        if (grouped[status]) grouped[status][month - 1] = count;
    });

    const startIndex = quarter === 'ALL' ? 0 : (quarter === 'Q1' ? 0 : quarter === 'Q2' ? 3 : quarter === 'Q3' ? 6 : 9);
    const endIndex = quarter === 'ALL' ? 12 : startIndex + 3;

    const series = chartStatuses.map(status => ({
        name: statusLabelMap[status],
        data: grouped[status].slice(startIndex, endIndex),
        color: statusColorMap[status],
    }));
    const colors = chartStatuses.map(status => statusColorMap[status]);

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            stacked: true,
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
                    csv: { filename: "monthly-status" },
                    svg: { filename: "monthly-status" },
                    png: { filename: "monthly-status" }
                }
            },
            foreColor: resolvedTheme === "dark" ? "#e0e0e0" : "#333",
            background: resolvedTheme === 'dark' ? 'dark' : 'light'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 10,
                borderRadiusApplication: 'end',
                borderRadiusWhenStacked: 'last',
                dataLabels: {
                    total: {
                        enabled: true,
                        style: {
                            fontSize: '13px',
                            fontWeight: 700,
                            color: resolvedTheme === "dark" ? "#fff" : "#000",
                        }
                    }
                }
            }
        },
        xaxis: {
            categories: monthLabels,
            labels: {
                style: {
                    colors: resolvedTheme === "dark" ? "#bbb" : "#333"
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: resolvedTheme === "dark" ? "#bbb" : "#333"
                }
            }
        },
        legend: {
            position: "bottom",
            offsetY: 10,
            labels: {
                colors: resolvedTheme === "dark" ? "#ccc" : "#444"
            }
        },
        fill: { opacity: 1 },
        colors,
        dataLabels: { enabled: true },
        tooltip: {
            theme: resolvedTheme === "dark" ? "dark" : "light",
            y: { formatter: (val: number) => `${val} เรื่อง` }
        },
        theme: { mode: (resolvedTheme === 'dark' ? 'dark' : 'light') as 'dark' | 'light' }
    };

    const isAllZero = series.every(s => s.data.every(v => v === 0));

    return (
        <Card className="@container/card transition-colors">
            <CardHeader>
                <CardTitle className="text-base font-semibold">สรุปจำนวนแยกตามเดือนและสถานะ</CardTitle>
                <Tabs value={source} onValueChange={setSource} className="w-full lg:w-auto">
                    <TabsList className="flex items-center justify-start flex-wrap h-auto">
                        {["ALL", "LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"].map(src => (
                            <TabsTrigger key={src} value={src} className="cursor-pointer">{src}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <div className="flex gap-2">
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
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="w-full h-[400px] rounded-xl" />
                ) : (
                    isAllZero ? (
                        <p className="text-center text-muted-foreground py-4">ไม่มีข้อมูล</p>
                    ) : (
                        <Chart
                            key={resolvedTheme + JSON.stringify(data)}
                            options={options}
                            series={series}
                            type="bar"
                            height={400}
                        />
                    )
                )}
            </CardContent>
        </Card>
    );
};

export default MonthlyStatusChart;
