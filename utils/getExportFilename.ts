// utils/getExportFilename.ts
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

function toThaiYear(date: Date) {
    const d = new Date(date);
    const year = d.getFullYear() + 543;
    return format(d, "dd-MM-") + year.toString();
}

interface ExportFilenameOptions {
    type: "excel" | "pdf";
    status?: string;
    dateRange?: DateRange;
    prefix?: string; // เพิ่มตรงนี้
    customLabel?: string; // เพิ่มตรงนี้
}

export function getExportFilename({
    type,
    status = "ALL",
    dateRange,
    prefix = "ข้อมูล",
    customLabel,
}: ExportFilenameOptions) {
    const statusLabel = status === "ALL" ? "ทั้งหมด" : status;
    const today = new Date();
    const thaiToday = toThaiYear(today);

    let rangeText = "";
    if (dateRange?.from && dateRange?.to) {
        const from = toThaiYear(dateRange.from);
        const to = toThaiYear(dateRange.to);
        rangeText = `_ช่วง-${from}_ถึง-${to}`;
    }

    const label = customLabel ?? `_${statusLabel}${rangeText}`;
    return `${prefix}${label}_${thaiToday}.${type === "excel" ? "xlsx" : "pdf"}`;
}
