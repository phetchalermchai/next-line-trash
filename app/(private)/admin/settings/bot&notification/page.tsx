"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Save } from "lucide-react";
import axios from "axios";

export default function BotNotificationSettingsPage() {
    const [lineToken, setLineToken] = useState("");
    const [telegramToken, setTelegramToken] = useState("");
    const [showLine, setShowLine] = useState(false);
    const [showTelegram, setShowTelegram] = useState(false);
    const [loading, setLoading] = useState(true);

    // โหลดค่าจาก API
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const lineTokenRes = await axios.get("/api//settings/notification-bot?key=LINE_ACCESS_TOKEN");
                const telegramTokenRes = await axios.get("/api/settings/notification-bot?key=TELEGRAM_BOT_TOKEN");
                setLineToken(lineTokenRes.data.value as string);
                setTelegramToken(telegramTokenRes.data.value as string);
            } catch {
                toast.error("โหลดข้อมูล token ไม่สำเร็จ");
            }
            setLoading(false);
        })();
    }, []);

    const saveToken = async (key: string, value: string) => {
        try {
            await axios.put("/api/settings/notification-bot", { key, value });
            await axios.put("/api/settings/notification-bot", { key, value });
            toast.success("บันทึกข้อมูลสำเร็จ");
        } catch {
            toast.error("บันทึกไม่สำเร็จ");
        }
    };

    return (
        <div className="space-y-4 m-6">
            <Card className="mx-auto w-full max-w-2xl">
                <CardContent className="flex flex-col gap-6 md:p-6">
                    <div>
                        <h2 className="text-xl font-bold">ตั้งค่าบอทแจ้งเตือน (Bot)</h2>
                        <p className="text-muted-foreground text-sm mt-2">
                            ตั้งค่า Token สำหรับบอทที่ใช้ส่งแจ้งเตือนเรื่องร้องเรียนถึงเจ้าหน้าที่และผู้ร้องเรียน <br />
                            <span className="text-xs text-orange-500">
                                หมายเหตุ: Group ID สำหรับแจ้งเตือนแต่ละโซน ต้องไปตั้งค่าที่หน้าจัดการพื้นที่โซน (Polygon Map)
                            </span>
                        </p>
                    </div>
                    <div className="space-y-4 mx-auto w-full max-w-2xl">
                        {/* LINE */}
                        <div>
                            <label className="font-semibold block mb-1">LINE_ACCESS_TOKEN</label>
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                <div className="relative w-full">
                                    <Input
                                        type={showLine ? "text" : "password"}
                                        value={lineToken}
                                        disabled={loading}
                                        onChange={e => setLineToken(e.target.value)}
                                        placeholder="ใส่ LINE ACCESS TOKEN"
                                        className="pr-12"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLine((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                        tabIndex={-1}
                                    >
                                        {showLine ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <Button
                                    onClick={() => saveToken("LINE_ACCESS_TOKEN", lineToken)}
                                    disabled={loading}
                                    className="min-w-[80px] mt-2 sm:mt-0 cursor-pointer"
                                >
                                    <Save className="w-4 h-4 mr-1" /> บันทึก
                                </Button>
                            </div>
                            <div className="text-xs mt-2 text-gray-500">
                                <b>วิธีหา LINE ACCESS TOKEN:</b>
                                <ol className="list-decimal ml-4">
                                    <li>เข้า <a href="https://developers.line.biz/console/" target="_blank" rel="noopener" className="underline">LINE Developers Console</a></li>
                                    <li>เลือก Channel → Messaging API → Section "Channel access token (long-lived)"</li>
                                    <li>กด <b>Issue</b> เพื่อสร้าง หรือ <b>Show</b> เพื่อ copy token</li>
                                </ol>
                            </div>
                            <div className="text-xs mt-2 text-gray-500">
                                <b>วิธีหา LINE GROUP ID:</b>
                                <ol className="list-decimal ml-4">
                                    <li>เชิญ Bot เข้า LINE กลุ่มที่ต้องการ</li>
                                    <li>ส่งข้อความในกลุ่ม แล้วไปที่ “Log Group ID” </li>
                                    <li>นำค่า groupId ไปใส่ที่ “ตั้งค่าพื้นที่โซน”</li>
                                </ol>
                            </div>
                        </div>
                        {/* Telegram */}
                        <div>
                            <label className="font-semibold block mb-1">TELEGRAM_BOT_TOKEN</label>
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                {/* Input + Eye Button */}
                                <div className="relative w-full">
                                    <Input
                                        type={showTelegram ? "text" : "password"}
                                        value={telegramToken}
                                        disabled={loading}
                                        onChange={e => setTelegramToken(e.target.value)}
                                        placeholder="ใส่ TELEGRAM BOT TOKEN"
                                        className="pr-12"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowTelegram(v => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1 rounded"
                                        tabIndex={-1}
                                    >
                                        {showTelegram ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>

                                </div>
                                {/* Save Button */}
                                <Button
                                    onClick={() => saveToken("TELEGRAM_BOT_TOKEN", telegramToken)}
                                    disabled={loading}
                                    className="min-w-[80px] mt-2 sm:mt-0 cursor-pointer"
                                >
                                    <Save className="w-4 h-4 mr-1" /> บันทึก
                                </Button>
                            </div>
                            <div className="text-xs mt-2 text-gray-500">
                                <b>วิธีหา TELEGRAM BOT TOKEN:</b>
                                <ol className="list-decimal ml-4">
                                    <li>คุยกับ <a href="https://t.me/BotFather" className="underline" target="_blank" rel="noopener">@BotFather</a></li>
                                    <li>สร้างหรือเลือกบอท → copy token</li>
                                </ol>
                            </div>
                            <div className="text-xs mt-2 text-gray-500">
                                <b>วิธีหา TELEGRAM GROUP ID:</b>
                                <ol className="list-decimal ml-4">
                                    <li>เชิญ Bot เข้า Telegram กลุ่มที่ต้องการ</li>
                                    <li>ส่งข้อความในกลุ่ม แล้วไปที่ “Log Group ID”</li>
                                    <li>นำค่า groupId ไปใส่ที่ “ตั้งค่าพื้นที่โซน”</li>
                                </ol>
                            </div>
                        </div>
                        {/* วิธีการกำหนด Group ID */}
                        <div className="border-t pt-4 text-xs text-muted-foreground">
                            <b>การตั้งค่า Group ID ของแต่ละโซน:</b> ไปที่ “ตั้งค่าพื้นที่โซน” → เลือกโซน → ใส่ LINE_GROUP_ID / TELEGRAM_GROUP_ID ตามต้องการ<br />
                            (แต่ละโซนแยกกัน สามารถเปลี่ยนแปลงภายหลังได้)
                        </div>
                        <div className="text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30 mt-4">
                            <b>หมายเหตุ:</b> <br />
                            - Token พวกนี้จะต้องใช้กับบอทของคุณเท่านั้น ห้ามเผยแพร่สาธารณะ <br />
                            - การเปลี่ยน Token หรือ Group ID อาจทำให้การแจ้งเตือนในกลุ่มเดิมใช้ไม่ได้ <br />
                            - ถ้าไม่แน่ใจ groupId ให้ติดต่อ dev หรือ admin ระบบ <br />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
