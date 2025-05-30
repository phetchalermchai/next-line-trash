"use client"
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
import api from '@/lib/axios';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface MonthlyTrend {
  month: number;
  count: number;
}

export default function MonthlyTrendChart() {
  const [data, setData] = useState<MonthlyTrend[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const year = new Date().getFullYear();
        const res = await api.get(`/dashboard/monthly-trend?year=${year}`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching MonthlyTrendChart:", err);
      }
    };
    fetchData();
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