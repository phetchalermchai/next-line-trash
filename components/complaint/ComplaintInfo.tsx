import { Complaint } from "@/types/complaint";
import { CheckCircle, Hourglass } from "lucide-react";

const statusMap = {
    PENDING: {
        label: "รอดำเนินการ",
        icon: <Hourglass className="w-3.5 h-3.5" />,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20",
    },
    DONE: {
        label: "เสร็จสิ้น",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        color: "bg-green-100 text-green-800 dark:bg-green-800/20",
    },
};

export const ComplaintInfo = ({ complaint }: { complaint: Complaint }) => {
    const status = statusMap[complaint.status];

    const thaiTime = ((date: string) => {
        return new Date(date).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
    })

    const renderSourceBadge = (source: string) => {
        const colorMap: Record<string, string> = {
            LINE: "bg-green-100 text-green-700 border-green-300",
            FACEBOOK: "bg-blue-100 text-blue-700 border-blue-300",
            PHONE: "bg-yellow-100 text-yellow-800 border-yellow-300",
            COUNTER: "bg-pink-100 text-pink-700 border-pink-300",
            OTHER: "bg-gray-100 text-gray-800 border-gray-300",
        };

        const color = colorMap[source] ?? "bg-gray-100 text-gray-700 border-gray-300";

        return (
            <span className={`inline-block text-xs px-2 py-1 rounded border ${color}`}>
                {source}
            </span>
        );
    };

    return (
        <>
            <h1 className="text-2xl font-bold">รายการร้องเรียน #{complaint.id.slice(-6).toUpperCase()}</h1>
            <div className="bg-muted p-4 rounded-md text-sm space-y-1 border">
                <p><strong>วันที่แจ้ง:</strong> {`${thaiTime(complaint.createdAt)} น.`}</p>
                <p><strong>อัปเดตล่าสุด:</strong> {`${thaiTime(complaint.updatedAt)} น.`}</p>
                {complaint.notifiedAt && (
                    <p><strong>แจ้งเตือนล่าสุด:</strong> {`${thaiTime(complaint.notifiedAt)} น.`}</p>
                )}
                {complaint.reporterName && <p><strong>ผู้แจ้ง:</strong> {complaint.reporterName || "ไม่ทราบชื่อ"}</p>}
                {complaint.receivedBy && <p><strong>ผู้รับแจ้ง:</strong> {complaint.receivedBy}</p>}
                {complaint.phone && <p><strong>เบอร์โทร:</strong> {complaint.phone}</p>}
                {complaint.description && <p><strong>รายละเอียด:</strong> {complaint.description}</p>}
                <p className="flex items-center gap-2">
                    <strong>ช่องทาง:</strong> {renderSourceBadge(complaint.source)}
                </p>
                {complaint.status === "DONE" && complaint.message && (
                    <p><strong>สรุปผล:</strong> {complaint.message}</p>
                )}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${status.color}`}>
                    {status.icon}
                    {status.label}
                </div>
            </div>
        </>
    );
};
