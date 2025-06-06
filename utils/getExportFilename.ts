// utils/getExportFilename.ts
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

function toThaiYear(date: Date) {
    const d = new Date(date);
    const year = d.getFullYear() + 543;
    return format(d, "dd-MM-") + year.toString();
}

export function getExportFilename(type: "excel" | "pdf", status: string, dateRange?: DateRange) {
    const statusLabel = status === "ALL" ? "ทั้งหมด" : status;
    const today = new Date();
    const thaiToday = toThaiYear(today);

    let rangeText = "";
    if (dateRange?.from && dateRange?.to) {
        const from = toThaiYear(dateRange.from);
        const to = toThaiYear(dateRange.to);
        rangeText = `_ช่วง-${from}_ถึง-${to}`;
    }

    return `ร้องเรียน_${statusLabel}${rangeText}_${thaiToday}.${type === "excel" ? "xlsx" : "pdf"}`;
}
