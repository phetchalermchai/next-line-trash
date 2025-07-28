import axios from "axios";
import { getSettingByKey } from "@/lib/settings/service";
import { prisma } from "@/lib/prisma";
import { Complaint, ComplaintReopenLog } from "@prisma/client";

type ComplaintWithReopenLogs = Complaint & { reopenLogs: ComplaintReopenLog[] };

// messageTemplate สามารถปรับแต่งได้
function buildTelegramMessage(complaint: ComplaintWithReopenLogs, zoneName?: string, type: string = "ใหม่", resultMessage?: string) {
    const date = type === "เสร็จสิ้น"
        ? complaint.updatedAt
        : complaint.createdAt;

    const thaiDate = new Date(date).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    const statusLabel = {
        PENDING: "รอดำเนินการ",
        DONE: "เสร็จสิ้น",
        VERIFIED: "ยืนยันผลแล้ว",
        REJECTED: "ไม่อนุมัติ",
        CANCELLED: "ยกเลิก",
        REOPENED: "ขอแก้ไข"
    };

    const sourceLabel = {
        LINE: "LINE",
        FACEBOOK: "Facebook",
        PHONE: "PHONE",
        COUNTER: "COUNTER",
        OTHER: "OTHER",
    };
    const mapUrl = complaint.location
        ? `https://www.google.com/maps/search/?api=1&query=${complaint.location}`
        : "https://www.google.com/maps";

    const detailUrl = `${process.env.WEB_BASE_URL}/complaints/${complaint.id}`;
    const reportUrl = `${process.env.WEB_BASE_URL}/admin/complaints/manage?reportId=${complaint.id}`;

    const lastReopenReason =
        complaint.status === "REOPENED" && complaint.reopenLogs?.length
            ? complaint.reopenLogs[complaint.reopenLogs.length - 1].reason
            : undefined;

    let txt = `
<b>เรื่องร้องเรียน (${type})</b>
<b>รหัสอ้างอิง:</b> #${complaint.id.slice(-6).toUpperCase()}
<b>วันที่${type === "เสร็จสิ้น" ? "รายงาน" : "แจ้ง"}:</b> ${thaiDate} น.
${zoneName ? `<b>โซน:</b> ${zoneName}` : ""}

<b>ช่องทาง:</b> ${sourceLabel[complaint.source] || complaint.source}
<b>ผู้แจ้ง:</b> ${complaint.reporterName || complaint.lineUserId || "-"}
${complaint.receivedBy && complaint.source !== "LINE" ? `<b>ผู้รับแจ้ง:</b> ${complaint.receivedBy}` : ""}
<b>เบอร์โทร:</b> ${complaint.phone || "-"}
<b>รายละเอียด:</b> ${complaint.description || "-"}
${resultMessage ? `\n<b>สรุปผล:</b> ${resultMessage}` : ""}

<b>สถานะ:</b> ${statusLabel[complaint.status] || complaint.status}
${lastReopenReason ? `<b>เหตุผล:</b> ${lastReopenReason}` : ""}
<b>แผนที่:</b> <a href="${mapUrl}">เปิด Google Maps</a>
  `.replace(/^ +/gm, '').trim();

    return {
        text: txt,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🌐 ดูรายละเอียด", url: detailUrl },
                    ...(complaint.status === "PENDING" || complaint.status === "REOPENED"
                        ? [{ text: "📝 แจ้งผลดำเนินงาน", url: reportUrl }]
                        : [])
                ]
            ]
        }
    }
}

export async function notifyTelegramGroupForComplaint(complaint: ComplaintWithReopenLogs) {
    try {
        const groupHeaderMap: Record<string, string> = {
            PENDING: "ใหม่",
            CANCELLED: "ยกเลิก",
            REJECTED: "ไม่อนุมัติ",
            REOPENED: "ขอแก้ไข"
        };
        // หาว่า zone ที่ complaint นี้อยู่คืออะไร
        let zone = null;
        if (complaint.zoneId) {
            zone = await prisma.zone.findUnique({ where: { id: complaint.zoneId } });
        }
        // หา chat id กลุ่ม (ถ้าไม่มีใน zone → ไป "โซนกลาง")
        let chatId = zone?.telegramGroupId || null;
        let zoneName = zone?.name ?? undefined;

        if (!chatId) {
            // fallback: หาโซนกลาง
            const middleZone = await prisma.zone.findFirst({ where: { name: "โซนกลาง" } });
            if (middleZone?.telegramGroupId) {
                chatId = middleZone.telegramGroupId;
                zoneName = middleZone.name;
            }
        }
        if (!chatId) return; // ไม่มี chat id จริง ๆ ข้ามไปเลย

        // หา token
        let tokenSetting = await getSettingByKey("TELEGRAM_BOT_TOKEN");
        let telegramToken = tokenSetting?.value ?? process.env.TELEGRAM_BOT_TOKEN;
        if (!telegramToken) return;

        const message = buildTelegramMessage(complaint, zoneName, groupHeaderMap[complaint.status as string]);
        await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            chat_id: chatId,
            text: message.text,
            parse_mode: message.parse_mode,
            reply_markup: message.reply_markup,
        });
    } catch (error: any) {
        console.error(error?.response?.data || error);
        throw error;
    }
}


export async function notifyTelegramGroupReport(complaint: ComplaintWithReopenLogs, resultMessage: string) {
    let zone = null;
    if (complaint.zoneId) {
        zone = await prisma.zone.findUnique({ where: { id: complaint.zoneId } });
    }
    let chatId = zone?.telegramGroupId || null;
    let zoneName = zone?.name ?? undefined;

    if (!chatId) {
        const middleZone = await prisma.zone.findFirst({ where: { name: "โซนกลาง" } });
        if (middleZone?.telegramGroupId) {
            chatId = middleZone.telegramGroupId;
            zoneName = middleZone.name;
        }
    }
    if (!chatId) return;

    let tokenSetting = await getSettingByKey("TELEGRAM_BOT_TOKEN");
    let telegramToken = tokenSetting?.value ?? process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramToken) return;

    const telegramMsg = buildTelegramMessage(complaint, zoneName, "เสร็จสิ้น", resultMessage);

    try {
        await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            chat_id: chatId,
            text: telegramMsg.text,
            parse_mode: telegramMsg.parse_mode,
            reply_markup: telegramMsg.reply_markup,
        });
    } catch (error) {
        console.error("[notifyTelegramGroupReport] ส่ง Telegram ไม่สำเร็จ:", error);
    }
}

export async function notifyManualTelegramGroupReminder(complaint: ComplaintWithReopenLogs) {
    let zone = null;
    if (complaint.zoneId) {
        zone = await prisma.zone.findUnique({ where: { id: complaint.zoneId } });
    }
    let chatId = zone?.telegramGroupId || null;
    let zoneName = zone?.name ?? undefined;

    if (!chatId) {
        const middleZone = await prisma.zone.findFirst({ where: { name: "โซนกลาง" } });
        if (middleZone?.telegramGroupId) {
            chatId = middleZone.telegramGroupId;
            zoneName = middleZone.name;
        }
    }
    if (!chatId) return;

    let tokenSetting = await getSettingByKey("TELEGRAM_BOT_TOKEN");
    let telegramToken = tokenSetting?.value ?? process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramToken) return;

    // นับจำนวนวันที่ร้องเรียนรอ (Pending) แล้ว
    const now = new Date();
    const created = new Date(complaint.createdAt);
    const diffCreatedDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    // เพิ่มข้อความระบุ "ร้องเรียนค้างมา X วัน"
    const telegramMsg = buildTelegramMessage(complaint, zoneName, `ค้าง ${diffCreatedDays} วัน`);

    try {
        await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            chat_id: chatId,
            text: telegramMsg.text,
            parse_mode: telegramMsg.parse_mode,
            reply_markup: telegramMsg.reply_markup,
        });
    } catch (error) {
        console.error("[notifyManualTelegramGroupReminder] ส่ง Telegram ไม่สำเร็จ:", error);
    }
}