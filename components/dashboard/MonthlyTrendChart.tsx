"use client"
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import axios from 'axios';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface MonthlyTrend {
  month: number;
  count: number;
  source: string;
}

export default function MonthlyTrendChart() {
  const [data, setData] = useState<MonthlyTrend[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const year = new Date().getFullYear();
        const res = await axios.get(`/api/complaints/dashboard/trends?year=${year}&groupBySource=true`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching MonthlyTrendChart:", err);
      }
    };
    fetchData();
  }, []);

  const monthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const sources = ["LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"];

  const grouped: Record<string, number[]> = {};
  sources.forEach(source => {
    grouped[source] = Array(12).fill(0);
  });

  data.forEach(({ month, count, source }) => {
    if (grouped[source]) {
      grouped[source][month - 1] = count;
    }
  });

  const foreColor = resolvedTheme === "dark" ? "#e0e0e0" : "#333";
  const mutedColor = resolvedTheme === "dark" ? "#bbb" : "#333";
  const tooltipTheme = resolvedTheme === "dark" ? "dark" : "light";

  const options = {
    chart: {
      id: "monthly-trend",
      type: "area" as const,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
        export: {
          csv: {
            filename: "monthly-trend",
            headerCategory: "เดือน",
            headerValue: "จำนวนเรื่องร้องเรียน",
          },
          svg: { filename: "monthly-trend" },
          png: { filename: "monthly-trend" },
        },
      },
      foreColor,
    },
    xaxis: {
      categories: monthLabels,
      labels: {
        style: {
          colors: mutedColor,
        },
      },
    },
    colors: ["#10b981", "#3b82f6", "#facc15", "#ec4899", "#6b7280"],
    tooltip: {
      theme: tooltipTheme,
    },
    stroke: {
      curve: "smooth" as const,
    },
    grid: {
      borderColor: resolvedTheme === "dark" ? "#444" : "#eee",
    },
  };

  const series = sources.map(source => ({
    name: source,
    data: grouped[source],
  }));

  return (
    <Card className="@container/card transition-colors">
      <CardHeader>
        <CardTitle className="text-base font-semibold">แนวโน้มร้องเรียนรายเดือน (แยกตามช่องทาง)</CardTitle>
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
  );
}
