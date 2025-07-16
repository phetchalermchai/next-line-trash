"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, CheckCircle, AlertTriangle, Link2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TelegramWebhookSetter() {
    const [loading, setLoading] = useState(false);
    const [botToken, setBotToken] = useState<string | null>(null);
    const [showFullUrl, setShowFullUrl] = useState(false);

    // รองรับ window/ssr
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/log-groupid`;

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/settings/notification-bot?key=TELEGRAM_BOT_TOKEN");
                const { value } = await res.json();
                setBotToken(value || "");
            } catch {
                setBotToken("");
            }
        })();
    }, []);

    const setTelegramWebhook = async () => {
        if (!botToken) {
            toast.error("ไม่พบ Telegram Bot Token");
            return;
        }
        setLoading(true);
        try {
            const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.ok) {
                toast.success(
                    <span>
                        <CheckCircle className="inline w-4 h-4 mr-1" />
                        ตั้งค่า Webhook สำเร็จ
                    </span>
                );
            } else {
                toast.error(
                    <span>
                        <AlertTriangle className="inline w-4 h-4 mr-1" />
                        ล้มเหลว: {data.description}
                    </span>
                );
            }
        } catch (err: any) {
            toast.error(
                <span>
                    <AlertTriangle className="inline w-4 h-4 mr-1" />
                    {err.message}
                </span>
            );
        }
        setLoading(false);
    };

    if (botToken === null) {
        return (
            <section className="mb-6 w-full max-w-2xl mx-auto">
                <div
                    className="
          flex flex-col sm:flex-row items-start gap-3 mb-4 p-4
          rounded-xl border-l-4
          bg-yellow-50 border-yellow-400
          dark:bg-yellow-950 dark:border-yellow-700
          shadow-sm
        "
                >
                    <Skeleton className="w-6 h-6 rounded-full bg-yellow-200 dark:bg-yellow-800 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-48 rounded bg-yellow-200 dark:bg-yellow-900" />
                        <Skeleton className="h-3 w-3/4 rounded bg-yellow-100 dark:bg-yellow-950" />
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                            <Skeleton className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900" />
                            <Skeleton className="h-4 w-44 rounded bg-yellow-100 dark:bg-yellow-950" />
                        </div>
                    </div>
                </div>
                <Skeleton className="h-11 w-56 rounded-lg mb-2 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-4 w-40 mt-4 rounded bg-gray-100 dark:bg-gray-900" />
            </section>
        );
    }
    if (!botToken) return null;

    return (
        <section className="mb-6 w-full max-w-2xl mx-auto">
            <div
                className="
          flex flex-col sm:flex-row items-start gap-3 mb-4 p-4
          rounded-xl border-l-4
          bg-yellow-50 border-yellow-400
          dark:bg-yellow-950 dark:border-yellow-700
          shadow-sm
        "
            >
                <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">
                        ต้องตั้งค่า Telegram Webhook ก่อนใช้งาน
                    </div>
                    <ul className="list-disc pl-5 text-xs text-yellow-900 dark:text-yellow-100 mb-2 space-y-0.5">
                        <li>
                            กดปุ่มนี้ <b>ทุกครั้ง</b> เมื่อเปลี่ยน Token หรือ domain
                        </li>
                        <li>
                            <b>Telegram</b> จะไม่ส่ง event เข้าระบบจนกว่าตั้งค่า webhook
                        </li>
                    </ul>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Link2 className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-yellow-900 dark:text-yellow-200">Webhook URL:</span>
                        <code
                            className="
                bg-yellow-100 dark:bg-yellow-900
                px-2 py-1 rounded
                text-yellow-900 dark:text-yellow-100
                text-xs select-all break-all max-w-[70vw] md:max-w-sm
              "
                            title={webhookUrl}
                        >
                            {!showFullUrl && webhookUrl.length > 45
                                ? webhookUrl.slice(0, 28) + "..." + webhookUrl.slice(-14)
                                : webhookUrl}
                        </code>
                        {webhookUrl.length > 45 && (
                            <button
                                className="text-xs text-blue-500 underline ml-2"
                                onClick={() => setShowFullUrl((v) => !v)}
                            >
                                {showFullUrl ? "ซ่อน" : "แสดงทั้งหมด"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <Button
                onClick={setTelegramWebhook}
                disabled={loading}
                variant="secondary"
                className="gap-2 shadow hover:bg-yellow-100 dark:hover:bg-yellow-900 transition"
                size="lg"
            >
                <Settings className="w-5 h-5" />
                {loading ? "กำลังตั้งค่า..." : "ตั้งค่า Telegram Webhook"}
            </Button>

            <div className="mt-5 text-xs text-gray-500 dark:text-gray-400">
                <b>หมายเหตุ:</b> ถ้าไม่ตั้งค่า Telegram จะไม่ log group id หรือรับ event จากกลุ่ม<br />
                <span className="text-orange-600 dark:text-orange-300">
                    LINE ไม่ต้องกดปุ่มนี้ ใช้งานได้ทันทีหลังตั้งค่า domain ใน LINE Developers
                </span>
            </div>
        </section>
    );
}
