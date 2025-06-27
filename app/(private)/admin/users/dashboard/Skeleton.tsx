import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


export function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

export function RecentUserSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ผู้ใช้ที่ลงทะเบียนล่าสุด (กำลังโหลด...)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
