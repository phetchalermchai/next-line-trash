"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusPie {
    status: string;
    count: number;
}

export default function StatusPieChart() {
    const [data, setData] = useState<StatusPie[]>([]);

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
        },
        labels: data.map((d) => {
            if (d.status === "PENDING") return "รอดำเนินการ";
            if (d.status === "DONE") return "ดำเนินการแล้ว";
            return d.status;
        }),
        legend: {
            position: "bottom" as const,
        },
        colors: ["#facc15", "#4ade80"],
        dataLabels: {
            enabled: true,
        },
    };

    const series = data.map((d) => typeof d.count === 'number' ? d.count : 0);

    return (
        <div className="min-h-[300px] w-full">
            {data.length > 0 && (
                <Chart
                    key={JSON.stringify(data)} // ✅ Force re-render เมื่อข้อมูลเปลี่ยน
                    options={options}
                    series={series}
                    type="donut"
                    height={300}
                />
            )}
        </div>
    );
}