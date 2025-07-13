"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/complaints/dashboard";
  const router = useRouter();

  const handleLogin = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  useEffect(() => {
    if (searchParams.get("error") === "OAuthAccountNotLinked") {
      toast.error("บัญชีนี้ถูกผูกกับผู้ใช้อื่นแล้ว กรุณาตรวจสอบ");
      router.replace("/admin/settings/profile?error=OAuthAccountNotLinked");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">เข้าสู่ระบบ</h1>
        <button
          onClick={() => handleLogin("google")}
          className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded"
        >
          เข้าสู่ระบบด้วย Google
        </button>
        <button
          onClick={() => handleLogin("facebook")}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          เข้าสู่ระบบด้วย Facebook
        </button>
        <button
          onClick={() => handleLogin("line")}
          className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded"
        >
          เข้าสู่ระบบด้วย LINE
        </button>
      </div>
    </div>
  );
}


