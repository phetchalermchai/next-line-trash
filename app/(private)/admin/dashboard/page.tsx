"use client"
import SummaryCard from "@/components/dashboard/SummaryCard";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrendChart";
import StatusPieChart from "@/components/dashboard/StatusPieChart";
import RecentComplaintList from "@/components/dashboard/RecentComplaintList";
import MonthlyStatusChart from "@/components/dashboard/MonthlyStatusChart";
import { useEffect, useState } from 'react'

interface SummaryData {
  total: number;
  done: number;
  pending: number;
  latestUpdatedAt: string | null;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_COMPLAINTS}/dashboard/summary`)
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) return <p>Loading...</p>

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">แดชบอร์ดเรื่องร้องเรียน</h1>

      {/* Section 1: Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon="🧾" label="ทั้งหมด" value={data.total} />
        <SummaryCard icon="🟡" label="รอดำเนินการ" value={data.pending} />
        <SummaryCard icon="🟢" label="ดำเนินการแล้ว" value={data.done} />
        <SummaryCard icon="📅" label="อัปเดตล่าสุด" value={data.latestUpdatedAt || '-'} />
      </section>

      {/* Section 2: แนวโน้มต่อเดือน */}
      <section className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">แนวโน้มร้องเรียนรายเดือน</h2>
        <MonthlyTrendChart />
      </section>

      {/* Section 3: สถานะ + รายการล่าสุด */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">สัดส่วนสถานะเรื่องร้องเรียน</h2>
          <StatusPieChart />
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 pb-2">รายการร้องเรียนล่าสุด</h2>
          <RecentComplaintList />
        </div>
      </section>

      {/* Section 4: สรุปแยกตามสถานะ + เดือน */}
      <section className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">สรุปจำนวนแยกตามเดือนและสถานะ</h2>
        <MonthlyStatusChart />
      </section>
    </div>
  );
}