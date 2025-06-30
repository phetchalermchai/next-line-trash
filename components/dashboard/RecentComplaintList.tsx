import Link from "next/link";
import { Clock, CheckCircle, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useEffect, useState } from 'react'
import { Complaint } from "@/types/complaint";
import axios from "axios";

const statusStyles = {
  PENDING: {
    icon: <Clock className="w-4 h-4 text-yellow-500" />,
    label: "รอดำเนินการ",
    color: "text-yellow-600 bg-yellow-50",
  },
  DONE: {
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    label: "สำเร็จ",
    color: "text-green-600 bg-green-50",
  },
};

export default function RecentComplaintList() {
  const [items, setItems] = useState<Complaint[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("api/dashboard/recent?limit=5");
        setItems(res.data);
      } catch (err) {
        console.error("Error fetching recent complaints:", err);
      }
    };

    fetchData();
  }, [])

  return (
    <Card className="@container/card transition-colors">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          รายการร้องเรียนล่าสุด
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const status = statusStyles[item.status];
            return (
              <div
                key={item.id}
                className="flex justify-between items-center border rounded-md px-4 py-2 hover:bg-muted transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {item.reporterName || "ไม่ระบุชื่อ"}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.createdAt}</p>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                >
                  {status.icon}
                  {status.label}
                </div>
                <Link
                  href={`/complaints/${item.id}`}
                  className="ml-4 p-2 hover:text-primary transition"
                >
                  <Search className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
