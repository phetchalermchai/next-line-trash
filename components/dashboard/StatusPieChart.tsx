"use client"
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
import api from '@/lib/axios';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusPie {
    status: string;
    count: number;
}

export default function StatusPieChart() {
    const [data, setData] = useState<StatusPie[]>([])

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
    }, [])

    const options = {
        chart: {
            type: "donut" as "donut",
        },
        labels: data.map((d) => {
            if (d.status === "PENDING") return "รอดำเนินการ";
            if (d.status === "DONE") return "ดำเนินการแล้ว";
            return d.status;
        }),
        legend: {
            position: "bottom" as "bottom",
        },
        colors: ["#facc15", "#4ade80"],
        dataLabels: {
            enabled: true,
        },
    }

    const series = data.map((d) => typeof d.count === 'number' ? d.count : 0);

    return (
        <div>
            <Chart options={options} series={series} type="donut" height={300} />
        </div>
    )
}