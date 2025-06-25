// file: app/(public)/unauthorized/page.tsx

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center px-4">
      <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
      <h1 className="text-2xl font-bold mb-2">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
      <p className="text-muted-foreground mb-6">
        โปรดตรวจสอบสิทธิ์ผู้ใช้งานของคุณ หรือติดต่อผู้ดูแลระบบหากคิดว่านี่เป็นความผิดพลาด
      </p>
      <Button asChild>
        <Link href="/">กลับหน้าหลัก</Link>
      </Button>
    </div>
  );
}
