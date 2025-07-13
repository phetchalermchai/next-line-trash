import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from 'react'
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { colorMap, statusMap } from "@/utils/complaintLabels";
import { formatThaiDatetime } from "@/utils/date";
import { Complaint } from "@/types/complaint";
import { Skeleton } from "../ui/skeleton";

export default function RecentComplaintList() {
  const [items, setItems] = useState<Complaint[]>([])
  const [source, setSource] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = source === "ALL" ? "/api/complaints/dashboard/recent?limit=5" : `/api/complaints/dashboard/recent?limit=5&source=${source}`;
        const res = await axios.get(url);
        setItems(res.data);
      } catch (err) {
        console.error("Error fetching recent complaints:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [source])

  return (
    <Card className="@container/card transition-colors">
      <CardHeader>
        <CardTitle className="text-base font-semibold">รายการร้องเรียนล่าสุด</CardTitle>
        <Tabs value={source} onValueChange={setSource} className="w-full lg:w-auto">
          <TabsList className="flex items-center justify-start flex-wrap h-auto">
            {['ALL', 'LINE', 'FACEBOOK', 'PHONE', 'COUNTER', 'OTHER'].map(src => (
              <TabsTrigger key={src} className='cursor-pointer' value={src}>{src}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center border rounded-md px-4 py-2">
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>
        ) : (
          items.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">ไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                return (
                  <div key={item.id} className="flex justify-between items-center border rounded-md px-4 py-2 hover:bg-muted transition">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.reporterName || "ไม่ระบุชื่อ"} <Badge className={colorMap[item.source]}>{item.source}</Badge></p>
                      <p className="text-xs text-muted-foreground">{formatThaiDatetime(item.createdAt)}</p>
                    </div>
                    <Badge className={`${statusMap[item.status]?.color || "bg-gray-100 text-gray-800"}`}>{statusMap[item.status].label}</Badge>
                    <Link href={`/complaints/${item.id}`} className="ml-4 p-2 hover:text-primary transition">
                      <Search className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
