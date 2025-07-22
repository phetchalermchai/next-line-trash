// file: utils/complaintLabels.ts

export const colorMap: Record<string, string> = {
  LINE: "bg-green-100 text-green-700 border-green-300",
  FACEBOOK: "bg-blue-100 text-blue-700 border-blue-300",
  PHONE: "bg-yellow-100 text-yellow-800 border-yellow-300",
  COUNTER: "bg-pink-100 text-pink-700 border-pink-300",
  OTHER: "bg-gray-100 text-gray-800 border-gray-300",
};

export const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "bg-yellow-100 text-yellow-800",
  },
  DONE: {
    label: "เสร็จสิ้น",
    color: "bg-green-100 text-green-800",
  },
  VERIFIED: {
    label: "ยืนยันผลแล้ว",
    color: "bg-blue-100 text-blue-800",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    color: "bg-red-100 text-red-800",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "bg-gray-100 text-gray-800",
  },
  REOPENED: {
    label: "ขอแก้ไข",
    color: "bg-purple-100 text-purple-800",
  },
};
