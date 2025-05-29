"use client"
import Chart from "react-apexcharts"

const data = {
  series: [
    {
      name: "เรื่องร้องเรียน",
      data: [2, 4, 7, 5, 3, 6, 8, 4, 3, 1, 0, 0], // Mock data รายเดือน
    },
  ],
  options: {
    chart: {
      type: "area" as "area",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as "smooth" },
    xaxis: {
      categories: [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ],
    },
    yaxis: {
      labels: { formatter: (val: number) => `${val}` },
    },
  },
}

export default function MonthlyTrendChart() {
  return (
    <div>
      <Chart options={data.options} series={data.series} type="area" height={300} />
    </div>
  )
}