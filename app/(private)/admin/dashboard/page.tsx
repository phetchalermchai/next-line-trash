"use client"
import SummaryCard from "@/components/dashboard/SummaryCard";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrendChart";
import StatusPieChart from "@/components/dashboard/StatusPieChart";
import RecentComplaintList from "@/components/dashboard/RecentComplaintList";
import MonthlyStatusChart from "@/components/dashboard/MonthlyStatusChart";
import { useEffect, useState } from 'react'
import { ClipboardList, Clock, CheckCircle2, CalendarDays } from "lucide-react"
import axios from "axios";

interface SummaryData {
  total: number;
  done: number;
  pending: number;
  latestUpdatedAt: string | null;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/complaints/dashboard/summary");
        setData(res.data);
      } catch (error) {
        console.error("Error fetching summary data:", error);
      }
    };

    fetchData();
  }, [])

  if (!data) return <p>Loading...</p>

  return (
    <div className="p-6 space-y-6">
      {/* Section 1: Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard icon={ClipboardList} label="ทั้งหมด" value={data.total} iconColor="text-yellow-500" />
        <SummaryCard icon={Clock} label="รอดำเนินการ" value={data.pending} iconColor="text-orange-500" />
        <SummaryCard icon={CheckCircle2} label="ดำเนินการแล้ว" value={data.done} iconColor="text-green-600" />
        <SummaryCard icon={CalendarDays} label="อัปเดตล่าสุด" value={data.latestUpdatedAt || '-'} iconColor="text-blue-500" />
      </section>

      {/* Section 2: แนวโน้มต่อเดือน */}
        <MonthlyTrendChart />

      {/* Section 3: สถานะ + รายการล่าสุด */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatusPieChart />
          <RecentComplaintList />
      </section>

      {/* Section 4: สรุปแยกตามสถานะ + เดือน */}
        <MonthlyStatusChart />
    </div>
  );
}