"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaLine } from "react-icons/fa6";
import { TermsPrivacyModal } from "./TermsPrivacyModal";

export default function LoginForm() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleLogin = async (provider: "google" | "facebook" | "line") => {
        setLoading(provider);
        await signIn(provider, { callbackUrl: "/admin/complaints/dashboard" });
        setLoading(null);
    };

    return (
        <Card className="w-full">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
                <CardDescription>โปรดเลือกเข้าสู่ระบบด้วยบัญชีที่คุณมี</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 py-6 text-base font-medium cursor-pointer"
                    onClick={() => handleLogin("google")}
                    disabled={loading !== null}
                >
                    <FcGoogle className="w-6 h-6" />
                    เข้าสู่ระบบด้วย Google
                </Button>
                <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 py-6 text-base font-medium cursor-pointer"
                    onClick={() => handleLogin("facebook")}
                    disabled={loading !== null}
                >
                    <FaFacebook className="w-6 h-6 text-[#1877f3]" />
                    เข้าสู่ระบบด้วย Facebook
                </Button>
                <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 py-6 text-base font-medium cursor-pointer"
                    onClick={() => handleLogin("line")}
                    disabled={loading !== null}
                >
                    <FaLine className="w-6 h-6 text-[#06C755]" />
                    เข้าสู่ระบบด้วย LINE
                </Button>
                <div className="mt-4 text-xs text-muted-foreground text-center flex flex-wrap gap-x-2 gap-y-1 justify-center">
                    การเข้าสู่ระบบถือว่าคุณยอมรับ
                    <TermsPrivacyModal type="terms" /> และ <TermsPrivacyModal type="privacy" />
                </div>
            </CardContent>
        </Card>
    );
}
