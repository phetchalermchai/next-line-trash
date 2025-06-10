"use client"
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react'
import { useTheme } from "next-themes"
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface MonthlyTrend {
  month: number;
  count: number;
}

export default function MonthlyTrendChart() {
  const [data, setData] = useState<MonthlyTrend[]>([])
  const { resolvedTheme } = useTheme()

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
      foreColor: resolvedTheme === "dark" ? "#e0e0e0" : "#333"
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as "smooth" },
    grid: {
      borderColor: resolvedTheme === "dark" ? "#444" : "#eee",
    },
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
      labels: {
        formatter: (val: number) => `${val}`,
        style: {
          colors: resolvedTheme === "dark" ? "#bbb" : "#333"
        }
      }
    },
    tooltip: {
      theme: resolvedTheme === "dark" ? "dark" : "light"
    }
  }

  const series = [
    {
      name: "เรื่องร้องเรียน",
      data: data.map(d => d.count),
    },
  ]
  return (
    <Card className="@container/card transition-colors">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          แนวโน้มร้องเรียนรายเดือน
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Chart
          key={JSON.stringify(data) + resolvedTheme}
          options={options}
          series={series}
          type="area"
          height={300}
        />
      </CardContent>
    </Card>
  )
}