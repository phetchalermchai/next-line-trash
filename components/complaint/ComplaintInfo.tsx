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
                {complaint.phone && <p><strong>เบอร์โทร:</strong> {complaint.phone}</p>}
                {complaint.description && <p><strong>รายละเอียด:</strong> {complaint.description}</p>}
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
