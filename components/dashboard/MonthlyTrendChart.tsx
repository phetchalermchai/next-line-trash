"use client"
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function MonthlyTrendChart() {
  const [data, setData] = useState<{ month: number; count: number }[]>([])

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    fetch(`${process.env.NEXT_PUBLIC_API_COMPLAINTS}/dashboard/monthly-trend?year=${currentYear}`)
      .then(res => res.json())
      .then(setData)
  }, [])

  const options = {
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
    }
  }

  const series = [
    {
      name: "เรื่องร้องเรียน",
      data: data.map(d => d.count),
    },
  ]
  return (
    <div>
      <Chart options={options} series={series} type="area" height={300} />
    </div>
  )
}