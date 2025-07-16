"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, CheckCircle, AlertTriangle, Link2 } from "lucide-react";

export default function TelegramWebhookSetter() {
    const [loading, setLoading] = useState(false);
    const [botToken, setBotToken] = useState("");
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
                toast.success(<span><CheckCircle className="inline w-4 h-4 mr-1" /> ตั้งค่า Webhook สำเร็จ</span>);
            } else {
                toast.error(<span><AlertTriangle className="inline w-4 h-4 mr-1" /> ล้มเหลว: {data.description}</span>);
            }
        } catch (err: any) {
            toast.error(<span><AlertTriangle className="inline w-4 h-4 mr-1" /> {err.message}</span>);
        }
        setLoading(false);
    };

    if (!botToken) return null;

    return (
        <div className="mb-6 max-w-xl w-full bg-white/70 border border-yellow-200 rounded-2xl shadow-sm p-6">
            {/* Alert/Info */}
            <div className="flex items-start gap-3 mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1" />
                <div>
                    <div className="font-semibold text-yellow-800 mb-1">
                        กรุณาตั้งค่า Telegram Webhook ก่อนใช้งาน!
                    </div>
                    <div className="text-xs text-yellow-900 leading-relaxed">
                        <ul className="list-disc pl-4">
                            <li>
                                ต้องกดปุ่มนี้ <b>ทุกครั้ง</b> หลังเปลี่ยน Token หรือเปลี่ยน domain
                            </li>
                            <li>
                                <span className="font-bold">Telegram</span> จะไม่ส่ง event อะไรเข้าระบบจนกว่าจะตั้งค่า webhook ถูกต้อง
                            </li>
                        </ul>
                        <div className="mt-2 flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">Webhook URL:</span>
                            <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-800 text-xs select-all">
                                {webhookUrl}
                            </code>
                        </div>
                    </div>
                </div>
            </div>

            {/* ปุ่มตั้งค่า */}
            <Button
                onClick={setTelegramWebhook}
                disabled={loading}
                variant="secondary"
                className="gap-2 shadow hover:bg-yellow-100 transition"
                size="lg"
            >
                <Settings className="w-5 h-5" />
                {loading ? "กำลังตั้งค่า..." : "ตั้งค่า Telegram Webhook"}
            </Button>

            <div className="mt-5 text-xs text-gray-500">
                <b>หมายเหตุ:</b> ถ้าไม่ตั้งค่า บอท Telegram จะไม่ log group id หรือรับ event จากกลุ่ม<br />
                <span className="text-orange-600">LINE ไม่ต้องกดปุ่มนี้ ใช้งานได้ทันทีหลังตั้งค่า domain ใน LINE Developers</span>
            </div>
        </div>
    );
}
