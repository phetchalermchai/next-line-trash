import axios from "axios";
import { getSettingByKey } from "@/lib/settings/service";
import { prisma } from "@/lib/prisma";
import { Complaint } from "@prisma/client";

// messageTemplate สามารถปรับแต่งได้
function buildTelegramMessage(complaint: Complaint, zoneName?: string, type: string = "ใหม่") {
    const thaiDate = new Date(complaint.createdAt).toLocaleString("th-TH", {
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
    };

    const sourceLabel = {
        LINE: "LINE",
        FACEBOOK: "Facebook",
        PHONE: "โทรศัพท์",
        COUNTER: "จุดบริการ",
        OTHER: "อื่นๆ",
    };
    const mapUrl = complaint.location
        ? `https://www.google.com/maps/search/?api=1&query=${complaint.location}`
        : "https://www.google.com/maps";

    const detailUrl = `${process.env.WEB_BASE_URL}/complaints/${complaint.id}`;
    const reportUrl = `${process.env.WEB_BASE_URL}/admin/complaints/manage?reportId=${complaint.id}`;

    let txt = `
📌 <b>เรื่องร้องเรียน (${type})</b>
<b>รหัสอ้างอิง:</b> #${complaint.id.slice(-6).toUpperCase()}
<b>วันที่แจ้ง:</b> ${thaiDate} น.
${zoneName ? `<b>โซน:</b> ${zoneName}` : ""}

<b>ช่องทาง:</b> ${sourceLabel[complaint.source] || complaint.source}
<b>ผู้แจ้ง:</b> ${complaint.reporterName || complaint.lineUserId || "-"}
${complaint.receivedBy && complaint.source !== "LINE" ? `<b>ผู้รับแจ้ง:</b> ${complaint.receivedBy}` : ""}
<b>เบอร์โทร:</b> ${complaint.phone || "-"}
<b>รายละเอียด:</b> ${complaint.description}

<b>สถานะ:</b> ${statusLabel[complaint.status] || complaint.status}
<b>แผนที่:</b> <a href="${mapUrl}">เปิด Google Maps</a>
  `.replace(/^ +/gm, '').trim();

    return {
        text: txt,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🌐 ดูรายละเอียด", url: detailUrl },
                    { text: "📝 แจ้งผลดำเนินงาน", url: reportUrl }
                ]
            ]
        }
    }
}

export async function notifyTelegramGroupForComplaint(complaint: Complaint) {
    try {
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

        const message = buildTelegramMessage(complaint, zoneName, "ใหม่");
        await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            chat_id: chatId,
            text: message.text,
            parse_mode: message.parse_mode,
            reply_markup: message.reply_markup,
        });
    } catch (error:any) {
        console.error(error?.response?.data || error);
        throw error;
    }
}
