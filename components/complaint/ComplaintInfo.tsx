import { Complaint } from "@/types/complaint";
import { Ban, CheckCircle, Clock, ShieldCheck, Undo2, XCircle } from "lucide-react";

const statusMap = {
    PENDING: {
        label: "รอดำเนินการ",
        icon: <Clock className="w-4 h-4 text-yellow-500" />,
        color: "text-yellow-600 bg-yellow-50",
    },
    DONE: {
        label: "เสร็จสิ้น",
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        color: "text-green-600 bg-green-50",
    },
    VERIFIED: {
        label: "ยืนยันผลแล้ว",
        icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
        color: "text-blue-600 bg-blue-50",
    },
    REJECTED: {
        label: "ไม่อนุมัติ/ปฏิเสธ",
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        color: "text-red-600 bg-red-50",
    },
    CANCELLED: {
        label: "ยกเลิก",
        icon: <Ban className="w-4 h-4 text-gray-500" />,
        color: "text-gray-600 bg-gray-300",
    },
    REOPENED: {
        label: "ขอแก้ไข/เปิดใหม่",
        icon: <Undo2 className="w-4 h-4 text-orange-500" />,
        color: "text-orange-600 bg-orange-50",
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
