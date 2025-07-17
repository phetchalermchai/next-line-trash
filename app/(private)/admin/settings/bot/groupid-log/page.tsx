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
import { Skeleton } from "@/components/ui/skeleton";
dayjs.extend(relativeTime);
dayjs.locale('th');

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
        setLoading(true);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const copyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("คัดลอก Group ID แล้ว!");
    };

    return (
        <div className="space-y-4 m-6">
            <Card className="max-w-2xl w-full mx-auto">
                <CardContent className="flex flex-col gap-6 md:p-6">
                    <TelegramWebhookSetter />
                    <div>
                        <div className="flex flex-row items-center gap-2 mb-2">
                            <h2 className="text-xl font-bold">
                                Log Group ID จากบอท
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchLogs}
                                disabled={loading}
                                className="border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-gray-50 dark:hover:bg-zinc-800/70 transition"
                                aria-label="Refresh"
                            >
                                <RefreshCw className={loading ? "animate-spin" : ""} />
                            </Button>
                        </div>
                        <div className="text-sm">
                            <span className="text-base">
                                เชิญบอทเข้ากลุ่ม แล้วพิมพ์ข้อความใดก็ได้ในกลุ่ม
                            </span>
                            <br />
                            ระบบจะ log groupId อัตโนมัติ
                            <br />
                            <span className="text-xs text-orange-500 dark:text-orange-300">
                                (Refresh หน้านี้เพื่อดู log ล่าสุด)
                            </span>
                        </div>
                    </div>
                    <div className="min-h-[120px] w-full">
                        {loading ? (
                            <ul className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <li
                                        key={i}
                                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl bg-muted/40 dark:bg-zinc-800/60 shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Skeleton className="w-14 h-6 rounded-full bg-green-100 dark:bg-green-900/40" />
                                            <Skeleton className="h-5 w-36 rounded bg-white dark:bg-zinc-950/60" />
                                            <Skeleton className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-900" />
                                            <Skeleton className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-900 ml-auto" />
                                        </div>
                                        <Skeleton className="h-8 w-full max-w-full rounded bg-gray-100 dark:bg-gray-900 mt-1" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <ul className="space-y-2">
                                {logs.length === 0 && (
                                    <li className="text-muted-foreground">
                                        ยังไม่มี log group id
                                    </li>
                                )}
                                {logs.map((log, i) => (
                                    <li
                                        key={i}
                                        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border border-gray-200 dark:border-zinc-800 p-3 rounded-xl bg-muted/40 dark:bg-zinc-800/60 shadow-sm`}
                                    >
                                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                                            {/* Badge + GroupId */}
                                            <Badge
                                                variant={log.source === "line" ? "outline" : "secondary"}
                                                className={log.source === "line"
                                                    ? "text-green-700 border-green-400 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/40"
                                                    : "text-blue-700 border-blue-400 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/40"
                                                }
                                            >
                                                {log.source === "line" ? "LINE" : "TELEGRAM"}
                                            </Badge>
                                            <span className="font-mono text-xs bg-white dark:bg-zinc-950/60 rounded px-2 py-1 break-all min-w-0 max-w-[60vw] sm:max-w-[240px]">
                                                {log.groupId}
                                            </span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => copyId(log.groupId)}
                                                title="Copy"
                                                className="hover:bg-gray-100 dark:hover:bg-zinc-900 flex-shrink-0"
                                            >
                                                <ClipboardCopy className="w-4 h-4" />
                                            </Button>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto sm:ml-0">
                                                {dayjs(log.time).fromNow()}
                                            </span>
                                        </div>
                                        {/* detail log */}
                                        <details className="w-full mt-1 sm:mt-0">
                                            <summary className="text-xs cursor-pointer underline text-gray-400 dark:text-gray-500">
                                                detail
                                            </summary>
                                            <pre className="text-xs bg-gray-100 dark:bg-zinc-900 rounded p-2 max-w-full max-h-32 overflow-x-auto overflow-y-auto mt-1">
                                                {JSON.stringify(log.detail, null, 2)}
                                            </pre>
                                        </details>
                                    </li>
                                ))}
                            </ul>

                        )}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                        <b>หมายเหตุ:</b> Log นี้เก็บแค่ในหน่วยความจำ (restart server แล้วจะหาย)
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
