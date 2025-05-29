"use client";
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MonthlyStatusChart = () => {
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
        colors: ["#facc15", "#22c55e"], // 🟡 Yellow for pending, 🟢 Green for resolved
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
            data: [2, 3, 1, 4, 2, 0, 1, 2, 3, 1, 0, 0]
        },
        {
            name: "ดำเนินการแล้ว",
            data: [5, 7, 8, 6, 9, 4, 3, 5, 6, 4, 3, 2]
        }
    ];

    return (
        <div>
            <Chart options={options} series={series} type="bar" height={350} />
        </div>
    );
};

export default MonthlyStatusChart;
