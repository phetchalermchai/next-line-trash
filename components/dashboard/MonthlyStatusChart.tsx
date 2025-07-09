"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import axios from 'axios';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type StatusType = 'PENDING' | 'DONE';

interface MonthlyStatus {
    month: number;
    status: StatusType;
    count: number;
}

const MonthlyStatusChart = () => {
    const [data, setData] = useState<MonthlyStatus[]>([]);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const year = new Date().getFullYear();
                const res = await axios.get(`/api/complaints/dashboard/monthly-status?year=${year}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching MonthlyStatusChart:", err);
            }
        };
        fetchData();
    }, []);

    const monthLabels = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.",
        "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    const grouped = {
        DONE: Array(12).fill(0),
        PENDING: Array(12).fill(0),
    }

    data.forEach(({ month, status, count }) => {
        grouped[status][month - 1] = count
    })

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            stacked: true,
            toolbar: { show: false },
            foreColor: resolvedTheme === "dark" ? "#e0e0e0" : "#333",
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 4,
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
            labels: {
                colors: resolvedTheme === "dark" ? "#ccc" : "#444"
            }
        },
        fill: {
            opacity: 1
        },
        colors: ["#facc15", "#22c55e"],
        dataLabels: {
            enabled: false
        },
        tooltip: {
            theme: resolvedTheme === "dark" ? "dark" : "light",
            y: {
                formatter: (val: number) => `${val} เรื่อง`
            }
        }
    };

    const series = [
        {
            name: "รอดำเนินการ",
            data: grouped.PENDING
        },
        {
            name: "ดำเนินการแล้ว",
            data: grouped.DONE
        }
    ];

    return (
        <Card className="@container/card transition-colors">
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    สรุปจำนวนแยกตามเดือนและสถานะ
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Chart
                    key={resolvedTheme + JSON.stringify(data)}
                    options={options}
                    series={series}
                    type="bar"
                    height={350}
                />
            </CardContent>
        </Card>
    );
};

export default MonthlyStatusChart;
