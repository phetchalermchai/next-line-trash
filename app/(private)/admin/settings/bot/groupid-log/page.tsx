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
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const copyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("คัดลอก Group ID แล้ว!");
    };

    return (
        <Card className="mb-8 max-w-2xl w-full mx-auto shadow-xl rounded-2xl border bg-white/90 dark:bg-zinc-900/90 border-gray-200 dark:border-zinc-800">
            <CardContent className="flex flex-col gap-8 p-4 sm:p-8">
                <TelegramWebhookSetter />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
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
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-base text-gray-700 dark:text-gray-100">
                        เชิญบอทเข้ากลุ่ม แล้วพิมพ์ข้อความใดก็ได้ในกลุ่ม
                    </span>
                    <br />
                    ระบบจะ log groupId อัตโนมัติ
                    <br />
                    <span className="text-xs text-orange-500 dark:text-orange-300">
                        (Refresh หน้านี้เพื่อดู log ล่าสุด)
                    </span>
                </div>
                <div className="min-h-[120px] w-full">
                    {loading ? (
                        <ul className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <li
                                    key={i}
                                    className={`
          flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3
          border border-gray-200 dark:border-zinc-800
          p-3 rounded-xl 
          bg-muted/40 dark:bg-zinc-800/60
          shadow-sm
        `}
                                >
                                    {/* Badge skeleton */}
                                    <Skeleton className="w-14 h-6 rounded-full bg-green-100 dark:bg-green-900/40" />

                                    {/* GroupId skeleton */}
                                    <Skeleton className="h-5 w-36 rounded bg-white dark:bg-zinc-950/60" />

                                    {/* Copy button skeleton */}
                                    <Skeleton className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-900" />

                                    {/* Time skeleton */}
                                    <Skeleton className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-900 sm:ml-auto" />

                                    {/* Detail skeleton */}
                                    <Skeleton className="h-8 w-full max-w-[180px] rounded bg-gray-100 dark:bg-gray-900 ml-0 sm:ml-2" />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="space-y-2">
                            {logs.length === 0 && (
                                <li className="text-muted-foreground dark:text-gray-400">
                                    ยังไม่มี log group id
                                </li>
                            )}
                            {logs.map((log, i) => (
                                <li
                                    key={i}
                                    className={`
                    flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 
                    border border-gray-200 dark:border-zinc-800
                    p-3 rounded-xl 
                    bg-muted/40 dark:bg-zinc-800/60
                    shadow-sm
                  `}
                                >
                                    <Badge
                                        variant={log.source === "line" ? "outline" : "secondary"}
                                        className={`
                      ${log.source === "line"
                                                ? "text-green-700 border-green-400 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/40"
                                                : "text-blue-700 border-blue-400 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/40"}
                    `}
                                    >
                                        {log.source === "line" ? "LINE" : "TELEGRAM"}
                                    </Badge>
                                    <span className="font-mono text-xs bg-white dark:bg-zinc-950/60 rounded px-2 py-1 break-all">
                                        {log.groupId}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => copyId(log.groupId)}
                                        title="Copy"
                                        className="hover:bg-gray-100 dark:hover:bg-zinc-900"
                                    >
                                        <ClipboardCopy className="w-4 h-4" />
                                    </Button>
                                    <span className="sm:ml-auto text-xs text-gray-400 dark:text-gray-500">
                                        {dayjs(log.time).fromNow()}
                                    </span>
                                    <details className="ml-0 sm:ml-2 w-full">
                                        <summary className="text-xs cursor-pointer underline text-gray-400 dark:text-gray-500">
                                            detail
                                        </summary>
                                        <pre className="text-xs bg-gray-100 dark:bg-zinc-900 rounded p-2 max-w-[360px] max-h-32 overflow-x-auto overflow-y-auto">
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
    );
}
