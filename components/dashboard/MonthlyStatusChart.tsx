"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MonthlyStatusChart = () => {
    const [data, setData] = useState<
        { month: number; status: 'PENDING' | 'DONE'; count: number }[]
    >([])

    useEffect(() => {
        const year = new Date().getFullYear()
        console.log(year);
        
        fetch(`${process.env.NEXT_PUBLIC_API_COMPLAINTS}/dashboard/monthly-status?year=${year}`)
            .then(res => res.json())
            .then(setData)
    }, [])

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
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 4,
            }
        },
        xaxis: {
            categories: [
                "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.",
                "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
            ]
        },
        legend: {
            position: "bottom"
        },
        fill: {
            opacity: 1
        },
        colors: ["#facc15", "#22c55e"],
        dataLabels: {
            enabled: false
        },
        tooltip: {
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
        <div>
            <Chart options={options} series={series} type="bar" height={350} />
        </div>
    );
};

export default MonthlyStatusChart;
