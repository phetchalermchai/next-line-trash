"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TelegramWebhookSetter from "./TelegramWebhookSetter";
dayjs.extend(relativeTime);

interface LogItem {
    source: "line" | "telegram";
    time: number;
    groupId: string;
    detail: any;
}

export default function GroupIdLogPage() {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        const res = await fetch("/api/webhook/log-groupid");
        const data = await res.json();
        setLogs(data);
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, []);

    const copyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("คัดลอก Group ID แล้ว!");
    };

    return (
        <Card className="mb-6 max-w-2xl mx-auto">
            <CardContent className="flex flex-col gap-6 p-6">
                <TelegramWebhookSetter />
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">Log Group ID จากบอท</h2>
                    <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                    เชิญบอทเข้ากลุ่ม แล้วพิมพ์ข้อความใดก็ได้ในกลุ่ม <br />
                    ระบบจะ log groupId อัตโนมัติ <br />
                    <span className="text-xs text-orange-500">
                        (Refresh หน้านี้เพื่อดู log ล่าสุด)
                    </span>
                </div>
                <ul className="space-y-2">
                    {logs.length === 0 && <li className="text-muted-foreground">ยังไม่มี log group id</li>}
                    {logs.map((log, i) => (
                        <li
                            key={i}
                            className="flex items-center gap-3 border p-2 rounded bg-muted/50"
                        >
                            <Badge
                                variant={log.source === "line" ? "outline" : "secondary"}
                                className={log.source === "line" ? "text-green-600 border-green-400" : "text-blue-600 border-blue-400"}
                            >
                                {log.source === "line" ? "LINE" : "TELEGRAM"}
                            </Badge>
                            <span className="font-mono text-xs bg-white rounded px-2 py-1">{log.groupId}</span>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyId(log.groupId)}
                                title="Copy"
                            >
                                <ClipboardCopy className="w-4 h-4" />
                            </Button>
                            <span className="ml-auto text-xs text-gray-400">{dayjs(log.time).fromNow()}</span>
                            {/* debug: แสดง json เพิ่มเติม (opt) */}
                            <details className="ml-2">
                                <summary className="text-xs cursor-pointer underline text-gray-400">detail</summary>
                                <pre className="text-xs bg-gray-100 rounded p-2 max-w-[360px] max-h-32 overflow-x-auto overflow-y-auto">
                                    {JSON.stringify(log.detail, null, 2)}
                                </pre>
                            </details>
                        </li>
                    ))}
                </ul>
                <div className="text-xs text-gray-400 mt-4">
                    <b>หมายเหตุ:</b> Log นี้เก็บแค่ในหน่วยความจำ (restart server แล้วจะหาย)
                </div>
            </CardContent>
        </Card>
    );
}
