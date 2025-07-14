"use client"
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface MonthlyTrend {
  month: number;
  count: number;
  source: string;
}

export default function MonthlyTrendChart() {
  const [data, setData] = useState<MonthlyTrend[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<string>('ALL');
  const [source, setSource] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const { resolvedTheme } = useTheme();

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const quarters = ['ALL', 'Q1', 'Q2', 'Q3', 'Q4'];
  const sources = ["ALL", "LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const qParam = quarter === 'ALL' ? '' : `&quarter=${quarter}`;
        const srcParam = source === 'ALL' ? '' : `&source=${source}`;
        const res = await axios.get(`/api/complaints/dashboard/trends?year=${year}&groupBySource=true${qParam}${srcParam}`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching MonthlyTrendChart:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, quarter, source]);

  let monthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  if (quarter === 'Q1') monthLabels = ["ม.ค.", "ก.พ.", "มี.ค."];
  else if (quarter === 'Q2') monthLabels = ["เม.ย.", "พ.ค.", "มิ.ย."];
  else if (quarter === 'Q3') monthLabels = ["ก.ค.", "ส.ค.", "ก.ย."];
  else if (quarter === 'Q4') monthLabels = ["ต.ค.", "พ.ย.", "ธ.ค."];

  const colorMap: Record<string, string> = {
    LINE: "#10b981",
    FACEBOOK: "#3b82f6",
    PHONE: "#facc15",
    COUNTER: "#ec4899",
    OTHER: "#6b7280",
  };

  const grouped: Record<string, number[]> = {};
  Object.keys(colorMap).forEach(src => {
    grouped[src] = Array(12).fill(0);
  });

  data.forEach(({ month, count, source }) => {
    if (grouped[source]) {
      grouped[source][month - 1] = count;
    }
  });

  const startIndex = quarter === 'ALL' ? 0 : (quarter === 'Q1' ? 0 : quarter === 'Q2' ? 3 : quarter === 'Q3' ? 6 : 9);
  const endIndex = quarter === 'ALL' ? 12 : startIndex + 3;

  const foreColor = resolvedTheme === "dark" ? "#e0e0e0" : "#333";
  const mutedColor = resolvedTheme === "dark" ? "#bbb" : "#333";
  const tooltipTheme = resolvedTheme === "dark" ? "dark" : "light";

  const selectedColor = colorMap[source] || Object.values(colorMap);

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
      background: resolvedTheme === 'dark' ? 'dark' : 'light'
    },
    xaxis: {
      categories: monthLabels,
      labels: { style: { colors: mutedColor } }
    },
    colors: source === 'ALL' ? Object.values(colorMap) : [selectedColor],
    tooltip: { theme: tooltipTheme },
    stroke: { curve: "smooth" as const },
    grid: { borderColor: resolvedTheme === "dark" ? "#444" : "#eee" },
    theme: { mode: (resolvedTheme === 'dark' ? 'dark' : 'light') as 'dark' | 'light' }
  };

  const series = source === 'ALL'
    ? sources.slice(1).map(src => ({ name: src, data: grouped[src].slice(startIndex, endIndex) }))
    : [{ name: source, data: grouped[source].slice(startIndex, endIndex) }];

  const isEmpty = series.every(s => s.data.every(value => value === 0));

  return (
    <Card className="@container/card transition-colors">
      <CardHeader>
        <CardTitle className="text-base font-semibold">แนวโน้มร้องเรียนรายเดือน (แยกตามช่องทาง)</CardTitle>
        <Tabs defaultValue="ALL" value={source} onValueChange={setSource} className="w-full lg:w-auto">
          <TabsList className="flex items-center justify-start flex-wrap h-auto">
            {sources.map((src) => (
              <TabsTrigger key={src} value={src} className='cursor-pointer'>{src}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
            <SelectTrigger className="w-[85px]">
              <SelectValue placeholder="ปี" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y + 543}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="ไตรมาส" />
            </SelectTrigger>
            <SelectContent>
              {quarters.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px] rounded-xl" />
        ) : isEmpty ? (
          <p className="text-center text-muted-foreground py-4">ไม่มีข้อมูล</p>
        ) : (
          <Chart
            key={JSON.stringify(data) + resolvedTheme + quarter + source}
            options={options}
            series={series}
            type="area"
            height={300}
          />
        )}
      </CardContent>
    </Card>
  );
}
