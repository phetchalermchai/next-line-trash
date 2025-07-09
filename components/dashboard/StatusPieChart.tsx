"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTheme } from "next-themes"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import axios from 'axios';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusPie {
    status: string;
    count: number;
}

export default function StatusPieChart() {
    const [data, setData] = useState<StatusPie[]>([]);
    const [source, setSource] = useState('ALL');
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`/api/complaints/dashboard/status-summary?source=${source}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching StatusPieChart:", err);
            }
        };
        fetchData();
    }, [source]);

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
        labels: data.map((d) => {
            if (d.status === "PENDING") return "รอดำเนินการ";
            if (d.status === "DONE") return "ดำเนินการแล้ว";
            return d.status;
        }),
        legend: {
            position: "bottom" as const,
            labels: {
                colors: resolvedTheme === "dark" ? "#bbb" : "#333"
            }
        },
        tooltip: {
            theme: resolvedTheme === "dark" ? "dark" : "light"
        },
        colors: ["#facc15", "#4ade80"],
        dataLabels: {
            enabled: true,
            style: {
                colors: [resolvedTheme === "dark" ? "#fff" : "#000"]
            }
        },
        theme: { mode: (resolvedTheme === 'dark' ? 'dark' : 'light') as 'dark' | 'light' }
    };

    const series = data.map((d) => typeof d.count === 'number' ? d.count : 0);

    return (
        <Card className="@container/card transition-colors w-full">
            <CardHeader>
                <div className="flex flex-col gap-2 lg:justify-between lg:items-start">
                    <CardTitle className="text-base font-semibold">สัดส่วนสถานะเรื่องร้องเรียน</CardTitle>
                    <Tabs defaultValue="ALL" onValueChange={setSource} className="w-full lg:w-auto">
                        <TabsList className="flex items-center justify-start flex-wrap h-auto">
                            <TabsTrigger value="ALL">ALL</TabsTrigger>
                            <TabsTrigger value="LINE">LINE</TabsTrigger>
                            <TabsTrigger value="FACEBOOK">FACEBOOK</TabsTrigger>
                            <TabsTrigger value="PHONE">PHONE</TabsTrigger>
                            <TabsTrigger value="COUNTER">COUNTER</TabsTrigger>
                            <TabsTrigger value="OTHER">OTHER</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent className="min-h-[300px]">
                {data.length > 0 && (
                    <Chart
                        key={JSON.stringify(data) + resolvedTheme}
                        options={options}
                        series={series}
                        type="donut"
                        height={300}
                    />
                )}
            </CardContent>
        </Card>
    );
}