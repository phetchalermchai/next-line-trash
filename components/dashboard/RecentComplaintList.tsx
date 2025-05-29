import Link from "next/link";
import { Clock, CheckCircle, Search } from "lucide-react";

interface ComplaintItem {
  id: string;
  date: string;
  reporter: string;
  status: "pending" | "resolved";
}

const mockData: ComplaintItem[] = [
  { id: "1", date: "28 พ.ค.", reporter: "คุณสมชาย", status: "resolved" },
  { id: "2", date: "27 พ.ค.", reporter: "คุณสายฝน", status: "pending" },
  { id: "3", date: "26 พ.ค.", reporter: "คุณวันดี", status: "resolved" },
  { id: "4", date: "25 พ.ค.", reporter: "คุณทวี", status: "resolved" },
  { id: "5", date: "24 พ.ค.", reporter: "คุณพิม", status: "pending" },
];

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
  return (
    <div>
      <div className="space-y-3">
        {mockData.map((item) => {
          const status = statusStyles[item.status];
          return (
            <div
              key={item.id}
              className="flex justify-between items-center border rounded-md px-4 py-2 hover:bg-muted transition"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{item.reporter}</p>
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
