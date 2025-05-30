import Link from "next/link";
import { Clock, CheckCircle, Search } from "lucide-react";
import { useEffect, useState } from 'react'

interface ComplaintItem {
  id: string;
  date: string;
  lineDisplayName: string;
  status: "pending" | "resolved";
}

const statusStyles = {
  pending: {
    icon: <Clock className="w-4 h-4 text-yellow-500" />,
    label: "รอดำเนินการ",
    color: "text-yellow-600 bg-yellow-50",
  },
  resolved: {
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    label: "สำเร็จ",
    color: "text-green-600 bg-green-50",
  },
};

export default function RecentComplaintList() {
  const [items, setItems] = useState<ComplaintItem[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_COMPLAINTS}/dashboard/recent?limit=5`)
      .then(res => res.json())
      .then(setItems)
  }, [])

  return (
    <div>
      <div className="space-y-3">
        {items.map((item) => {
          const status = statusStyles[item.status];
          return (
            <div
              key={item.id}
              className="flex justify-between items-center border rounded-md px-4 py-2 hover:bg-muted transition"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{item.lineDisplayName}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
              >
                {status.icon}
                {status.label}
              </div>
              <Link
                href={`/admin/complaints/${item.id}`}
                className="ml-4 p-2 hover:text-primary transition"
              >
                <Search className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
