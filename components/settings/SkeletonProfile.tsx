"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonProfile() {
  return (
    <div className="space-y-4 m-6">
      {/* หัวข้อ */}
      <Skeleton className="h-7 w-40 rounded-full" />

      {/* Card ProfileSection */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-6">
          {/* ส่วนโปรไฟล์บนสุด */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center w-full gap-3">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex flex-col gap-2 items-center">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
                <div className="flex gap-2 mt-1">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* ผูกบัญชีเพิ่มเติม */}
          <div className="space-y-4 mx-auto w-full max-w-2xl">
            <Skeleton className="h-5 w-32 mb-2 rounded" />
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center border rounded-lg p-3 gap-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-5 w-6 rounded" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            ))}
          </div>

          {/* ปิดบัญชี/ลบบัญชี */}
          <div className="mt-8 mx-auto w-full max-w-2xl">
            <Skeleton className="h-5 w-32 mb-2 rounded bg-red-200" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-80 rounded" />
              <Skeleton className="h-8 w-28 rounded bg-red-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-7 w-40 rounded-full" />
      {/* Card API Key Section */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-7 w-40 mb-2 rounded" />
          {/* input + calendar + button */}
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <Skeleton className="h-10 w-full md:w-[320px] rounded" />
            <Skeleton className="h-10 w-full md:w-[200px] rounded" />
            <Skeleton className="h-10 w-32 rounded" />
          </div>
          {/* list api key */}
          <ul className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <li key={i} className="flex justify-between items-center border p-2 rounded">
                <div>
                  <Skeleton className="h-5 w-32 rounded mb-2" />
                  <Skeleton className="h-4 w-44 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
