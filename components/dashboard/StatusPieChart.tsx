"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useTheme } from "next-themes"
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusPie {
    status: string;
    count: number;
}

export default function StatusPieChart() {
    const [data, setData] = useState<StatusPie[]>([]);
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/dashboard/status-distribution');
                setData(res.data);
            } catch (err) {
                console.error("Error fetching StatusPieChart:", err);
            }
        };
        fetchData();
    }, []);

    const options = {
        chart: {
            type: "donut" as const,
            foreColor: resolvedTheme === "dark" ? "#e0e0e0" : "#333",
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
    };

    const series = data.map((d) => typeof d.count === 'number' ? d.count : 0);

    return (
        <div className="min-h-[300px] w-full">
            {data.length > 0 && (
                <Chart
                    key={JSON.stringify(data) + resolvedTheme} 
                    options={options}
                    series={series}
                    type="donut"
                    height={300}
                />
            )}
        </div>
    );
}