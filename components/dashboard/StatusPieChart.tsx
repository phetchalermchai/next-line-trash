"use client"
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function StatusPieChart() {
    const [data, setData] = useState<{ status: string; count: number }[]>([])

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_COMPLAINTS}/dashboard/status-distribution`)
            .then(res => res.json())
            .then(setData)
    }, [])

    const options = {
        chart: {
            type: "donut" as "donut",
        },
        labels: ["รอดำเนินการ", "ดำเนินการแล้ว"],
        legend: {
            position: "bottom" as "bottom",
        },
        colors: ["#facc15", "#4ade80"],
        dataLabels: {
            enabled: true,
        },
    }

    const series = data.map(d => d.count)

    return (
        <div>
            <Chart options={options} series={series} type="donut" height={300} />
        </div>
    )
}