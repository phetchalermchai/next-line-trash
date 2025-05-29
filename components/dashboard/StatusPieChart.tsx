"use client"
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const data = {
    series: [6, 18], // [Pending, Resolved] — mock data
    labels: ["รอดำเนินการ", "ดำเนินการแล้ว"],
    options: {
        chart: {
            type: "donut" as "donut",
        },
        labels: ["รอดำเนินการ", "ดำเนินการแล้ว"],
        legend: {
            position: "bottom" as "bottom",
        },
        colors: ["#facc15", "#4ade80"], // เหลือง เขียว
        dataLabels: {
            enabled: true,
        },
    },
}

export default function StatusPieChart() {
    return (
        <div>
            <Chart options={data.options} series={data.series} type="donut" height={300} />
        </div>
    )
}