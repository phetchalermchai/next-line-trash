"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ComplaintDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Info Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" /> {/* วันที่แจ้ง */}
          <Skeleton className="h-5 w-40" /> {/* วันที่อัปเดต */}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" /> {/* ช่องทาง */}
          <Skeleton className="h-5 w-24" /> {/* สถานะ */}
        </div>
      </div>
      {/* รายละเอียด */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" /> {/* ผู้แจ้ง */}
          <Skeleton className="h-5 w-32" /> {/* ผู้รับแจ้ง */}
          <Skeleton className="h-5 w-32" /> {/* เบอร์โทร */}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" /> {/* รายละเอียด */}
          <Skeleton className="h-5 w-44" />
        </div>
      </div>
      {/* แผนที่ */}
      <div>
        <Skeleton className="h-5 w-32 mb-2" /> {/* label "ตำแหน่งที่ตั้ง" */}
        <Skeleton className="w-full h-40 rounded-xl" />
      </div>
      {/* รูปภาพก่อน/หลัง */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" /> {/* label "ภาพก่อน" */}
          <div className="flex gap-2">
            <Skeleton className="w-20 h-16 rounded-xl" />
            <Skeleton className="w-20 h-16 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" /> {/* label "ภาพหลัง" */}
          <div className="flex gap-2">
            <Skeleton className="w-20 h-16 rounded-xl" />
            <Skeleton className="w-20 h-16 rounded-xl" />
          </div>
        </div>
      </div>
      {/* ปุ่มย้อนกลับ */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-32 rounded" />
      </div>
    </div>
  );
}
