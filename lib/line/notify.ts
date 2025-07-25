import axios from "axios";
import { prisma } from "@/lib/prisma";
import { getSettingByKey } from "@/lib/settings/service";
import { Complaint, ComplaintSource, ComplaintStatus } from "@prisma/client";

// ไม่ใช้แล้ว
export async function notifyUserAndGroup(id: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");
    if (!complaint.lineUserId) throw new Error("Missing lineUserId");

    const groupSetting = await getSettingByKey("LINE_GROUP_ID");
    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");

    if (!groupSetting || !tokenSetting) throw new Error("LINE_GROUP_ID หรือ LINE_ACCESS_TOKEN ไม่พบใน DB");
    console.log(groupSetting);
    console.log(tokenSetting);

    const flexGroup = buildGroupFlex(complaint, "ใหม่");
    const flexUser = buildUserFlex(complaint);

    await pushMessageToGroup(groupSetting.value, [flexGroup], tokenSetting.value);
    await pushMessageToUser(complaint.lineUserId, [flexUser], tokenSetting.value);;
  } catch (error) {
    console.error("[notifyUserAndGroup] Error:", error);
    throw error;
  }
}

export async function notifyLineUserAndLineGroup(complaint: Complaint, groupId: string, token: string) {
  try {
    if (!complaint.lineUserId) throw new Error("Missing lineUserId");

    const groupHeaderMap: Record<string, string> = {
      PENDING: "ใหม่",
      CANCELLED: "ยกเลิก",
      REJECTED: "ไม่อนุมัติ",
    };

    const flexGroup = buildGroupFlex(complaint, groupHeaderMap[complaint.status as string]);
    const flexUser = buildUserFlex(complaint);

    await pushMessageToGroup(groupId, [flexGroup], token);
    await pushMessageToUser(complaint.lineUserId, [flexUser], token);
  } catch (error) {
    console.error("[notifyUserAndGroup] Error:", error);
    throw error;
  }
}

// ไม่ใช้แล้ว
export async function notifyGroupOnly(id: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");

    const groupSetting = await getSettingByKey("LINE_GROUP_ID");
    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");

    if (!groupSetting || !tokenSetting) throw new Error("LINE_GROUP_ID หรือ LINE_ACCESS_TOKEN ไม่พบใน DB");

    const flexGroup = buildGroupFlex(complaint, "ใหม่");
    await pushMessageToGroup(groupSetting.value, [flexGroup], tokenSetting.value);
  } catch (error) {
    console.error("[notifyGroupOnly] Error:", error);
    throw error;
  }
}

export async function notifyLineGroup(lineGroupId: string, complaint: any, lineToken: string) {
  try {
    const flexGroup = buildGroupFlex(complaint, "ใหม่");
    await pushMessageToGroup(lineGroupId, [flexGroup], lineToken);
  } catch (error) {
    console.error("[notifyLineGroup] Error:", error);
    throw error;
  }
}

// ไม่ใช้แล้ว
export async function notifyReportResultToGroup(id: string, message: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");

    const groupSetting = await getSettingByKey("LINE_GROUP_ID");
    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
    if (!groupSetting || !tokenSetting) throw new Error("LINE_GROUP_ID หรือ LINE_ACCESS_TOKEN ไม่พบใน DB");

    const flexGroup = buildGroupFlexReport(complaint, message);
    await pushMessageToGroup(groupSetting.value, [flexGroup], tokenSetting.value);
  } catch (error) {
    console.error("[notifyReportResultToGroup] Error:", error);
    throw error;
  }
}

export async function notifyReportResultToLineGroup(id: string, message: string, groupId: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");

    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
    if (!tokenSetting) throw new Error("LINE_ACCESS_TOKEN ไม่พบใน DB");

    const flexGroup = buildGroupFlexReport(complaint, message);
    await pushMessageToGroup(groupId, [flexGroup], tokenSetting.value);
  } catch (error) {
    console.error("[notifyReportResultToGroup] Error:", error);
    throw error;
  }
}

// ไม่ใช้แล้ว
export async function notifyReportResultToUser(id: string, message: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");
    if (!complaint.lineUserId) throw new Error("Missing lineUserId");

    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
    if (!tokenSetting) throw new Error("LINE_ACCESS_TOKEN ไม่พบใน DB");

    const flexUser = buildUserFlexReport(complaint, message);
    await pushMessageToUser(complaint.lineUserId, [flexUser], tokenSetting.value);
  } catch (error) {
    console.error("[notifyReportResultToUser] Error:", error);
    throw error;
  }
}

export async function notifyReportResultToLineUser(id: string, message: string, userId: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");

    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
    if (!tokenSetting) throw new Error("LINE_ACCESS_TOKEN ไม่พบใน DB");

    const flexUser = buildUserFlexReport(complaint, message);
    await pushMessageToUser(userId, [flexUser], tokenSetting.value);
  } catch (error) {
    console.error("[notifyReportResultToUser] Error:", error);
    throw error;
  }
}

// ไม่ใช้แล้ว
export async function notifyManualGroupReminder(id: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");

    const now = new Date();

    if (complaint.notifiedAt) {
      const diff = now.getTime() - new Date(complaint.notifiedAt).getTime();
      const diffDays = diff / (1000 * 60 * 60 * 24);

      if (diffDays < 1) {
        throw new Error("แจ้งเตือนได้วันละครั้งเท่านั้น");
      }
    }

    if (complaint.status === "DONE") {
      throw new Error("ไม่สามารถแจ้งเตือนได้ เนื่องจากเรื่องนี้ดำเนินการเสร็จแล้ว");
    }

    const created = new Date(complaint.createdAt);
    const diffCreatedDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    const groupSetting = await getSettingByKey("LINE_GROUP_ID");
    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
    if (!groupSetting || !tokenSetting) throw new Error("LINE_GROUP_ID หรือ LINE_ACCESS_TOKEN ไม่พบใน DB");

    const flex = buildGroupFlex(complaint, `${diffCreatedDays} วัน`);
    await pushMessageToGroup(groupSetting.value, [flex], tokenSetting.value);

    await prisma.complaint.update({
      where: { id },
      data: { notifiedAt: now },
    });

    return { message: "แจ้งเตือนสำเร็จ" };
  } catch (error) {
    console.error("[notifyManualGroupReminder] Error:", error);
    throw error;
  }
}

export async function notifyManualLineGroupReminder(id: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");

    const now = new Date();

    if (complaint.notifiedAt) {
      const diff = now.getTime() - new Date(complaint.notifiedAt).getTime();
      const diffDays = diff / (1000 * 60 * 60 * 24);
      if (diffDays < 1) {
        throw new Error("แจ้งเตือนได้วันละครั้งเท่านั้น");
      }
    }

    if (complaint.status === "DONE") {
      throw new Error("ไม่สามารถแจ้งเตือนได้ เนื่องจากเรื่องนี้ดำเนินการเสร็จแล้ว");
    }

    // ==== หากลุ่มจากโซน ====
    let groupId: string | null = null;
    if (complaint.zoneId) {
      const zone = await prisma.zone.findUnique({ where: { id: complaint.zoneId } });
      groupId = zone?.lineGroupId ?? null;
    }

    // fallback: โซนกลาง
    if (!groupId) {
      const middleZone = await prisma.zone.findFirst({ where: { name: "โซนกลาง" } });
      groupId = middleZone?.lineGroupId ?? null;
    }

    if (!groupId) throw new Error("ไม่พบ LINE group สำหรับแจ้งเตือน");

    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");
    if (!tokenSetting?.value) throw new Error("LINE_ACCESS_TOKEN ไม่พบใน DB");

    // คำนวณจำนวนวันที่สร้างมาแล้ว
    const created = new Date(complaint.createdAt);
    const diffCreatedDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    const flex = buildGroupFlex(complaint, `${diffCreatedDays} วัน`);

    await pushMessageToGroup(groupId, [flex], tokenSetting.value);

    await prisma.complaint.update({
      where: { id },
      data: { notifiedAt: now },
    });

    return { message: "แจ้งเตือนสำเร็จ" };
  } catch (error) {
    console.error("[notifyManualGroupReminder] Error:", error);
    throw error;
  }
}

async function pushMessageToGroup(groupId: string, messages: any[], token: string) {
  await axios.post(
    "https://api.line.me/v2/bot/message/push",
    { to: groupId, messages },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

async function pushMessageToUser(userId: string, messages: any[], token: string) {
  await axios.post(
    "https://api.line.me/v2/bot/message/push",
    { to: userId, messages },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}

function buildGroupFlex(c: Complaint, type: string = "ใหม่") {
  const lineDisplayName = c.reporterName || c.lineUserId;
  const mapUrl = c.location
    ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
    : "https://www.google.com/maps";

  const statusColor: Record<ComplaintStatus, string> = {
    PENDING: "#efb100",
    DONE: "#3bb273",
    VERIFIED: "#2196f3",
    REJECTED: "#ef4444",
    CANCELLED: "#6b7280",
    REOPENED: "#a21caf"
  };

  const statusLabel: Record<ComplaintStatus, string> = {
    PENDING: "รอดำเนินการ",
    DONE: "เสร็จสิ้น",
    VERIFIED: "ยืนยันผลแล้ว",
    REJECTED: "ไม่อนุมัติ",
    CANCELLED: "ยกเลิก",
    REOPENED: "ขอแก้ไข"
  };

  const sourceColor: Record<ComplaintSource, string> = {
    LINE: "#00c300",
    FACEBOOK: "#1877f2",
    PHONE: "#f59e0b",
    COUNTER: "#9333ea",
    OTHER: "#6b7280",
  };

  const thaiDate = new Date(c.createdAt).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const isLine = c.source === "LINE";

  return {
    type: "flex",
    altText: `📌 เรื่องร้องเรียน - (${type})`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
            size: "sm"
          },
          {
            type: "text",
            text: `เรื่องร้องเรียน - (${type})`,
            weight: "bold",
            size: "lg",
            align: "center",
            margin: "lg"
          },
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "ช่องทาง:",
                color: "#aaaaaa",
                size: "sm",
                flex: 0
              },
              {
                type: "text",
                text: c.source,
                color: sourceColor[c.source],
                size: "sm",
                margin: "sm",
                flex: 0,
                weight: "bold"
              }
            ],
            justifyContent: "center",
            alignItems: "center"
          },
          {
            type: "text",
            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
            size: "sm",
            weight: "bold",
            align: "center",
            margin: "lg"
          },
          {
            type: "text",
            text: `${thaiDate} น.`,
            size: "xs",
            align: "center",
            color: "#aaaaaa"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ผู้แจ้ง",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: lineDisplayName,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              !isLine && c.receivedBy && {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ผู้รับแจ้ง",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: c.receivedBy,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "เบอร์",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: c.phone || "ไม่ระบุ",
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "รายละเอียด",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: c.description,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "พิกัด",
                    size: "sm",
                    color: "#aaaaaa",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: "เปิดใน Google Maps",
                    flex: 5,
                    size: "sm",
                    color: "#155dfc",
                    action: {
                      type: "uri",
                      label: "action",
                      uri: mapUrl,
                      altUri: {
                        desktop: mapUrl
                      }
                    },
                    decoration: "underline"
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "สถานะ",
                    flex: 2,
                    size: "sm",
                    color: "#aaaaaa"
                  },
                  {
                    type: "text",
                    text: statusLabel[c.status],
                    flex: 5,
                    size: "sm",
                    color: statusColor[c.status],
                    weight: "bold"
                  }
                ]
              }
            ].filter(Boolean)
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียด",
              uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
            }
          },
          c.status === "PENDING" && {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "แจ้งผลดำเนินงาน",
              uri: `${process.env.WEB_BASE_URL}/admin/complaints/manage?reportId=${c.id}`
            }
          }
        ],
        flex: 0
      }
    }
  };
}

function buildUserFlex(c: Complaint) {
  const lineDisplayName = c.reporterName || c.lineUserId;
  const mapUrl = c.location
    ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
    : "https://www.google.com/maps";

  const statusLabel: Record<ComplaintStatus, string> = {
    PENDING: "รอดำเนินการ",
    DONE: "เสร็จสิ้น",
    VERIFIED: "ยืนยันผลแล้ว",
    REJECTED: "ไม่อนุมัติ",
    CANCELLED: "ยกเลิก",
    REOPENED: "ขอแก้ไข"
  };

  const statusColor: Record<ComplaintStatus, string> = {
    PENDING: "#efb100",
    DONE: "#3bb273",
    VERIFIED: "#2196f3",
    REJECTED: "#ef4444",
    CANCELLED: "#6b7280",
    REOPENED: "#a21caf",
  };

  const userFooterMap: Record<string, string> = {
    CANCELLED: "ระบบได้ยกเลิกเรื่องร้องเรียนของคุณแล้ว",
    REJECTED: "ระบบไม่อนุมัติรับเรื่องร้องเรียนของคุณแล้ว",
  };

  const thaiDate = new Date(c.createdAt).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return {
    type: "flex",
    altText: "📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
            size: "sm"
          },
          {
            type: "text",
            text: "เรื่องร้องเรียนของคุณ",
            weight: "bold",
            size: "lg",
            align: "center",
            margin: "lg"
          },
          {
            type: "text",
            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
            size: "sm",
            weight: "bold",
            align: "center",
            margin: "lg"
          },
          {
            type: "text",
            text: `${thaiDate} น.`,
            size: "xs",
            align: "center",
            color: "#aaaaaa"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ผู้แจ้ง",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: lineDisplayName,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "เบอร์",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: c.phone || "ไม่ระบุ",
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "รายละเอียด",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: c.description,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "พิกัด",
                    size: "sm",
                    color: "#aaaaaa",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: "เปิดใน Google Maps",
                    flex: 5,
                    size: "sm",
                    color: "#155dfc",
                    action: {
                      type: "uri",
                      label: "action",
                      uri: mapUrl,
                      altUri: {
                        desktop: mapUrl
                      }
                    },
                    decoration: "underline"
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: "สถานะ",
                    flex: 2,
                    size: "sm",
                    color: "#aaaaaa"
                  },
                  {
                    type: "text",
                    text: statusLabel[c.status],
                    flex: 5,
                    size: "sm",
                    color: statusColor[c.status],
                    weight: "bold"
                  }
                ]
              }
            ]
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "text",
            text: userFooterMap[c.status as ComplaintStatus] || "ระบบได้รับเรื่องร้องเรียนของคุณแล้ว",
            wrap: true,
            weight: "bold",
            align: "center",
            margin: "lg"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียด",
              uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
            }
          }
        ],
        flex: 0
      }
    }
  };
}

function buildUserFlexReport(c: Complaint, message: string) {
  const mapUrl = c.location
    ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
    : "https://www.google.com/maps";
  return {
    type: "flex",
    altText: "📮 ผลการดำเนินงานของคุณ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
            size: "sm"
          },
          {
            type: "text",
            text: "เรื่องร้องเรียน (เสร็จสิ้น)",
            weight: "bold",
            size: "lg",
            align: "center",
            margin: "lg"
          },
          {
            type: "text",
            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
            size: "sm",
            weight: "bold",
            align: "center",
            margin: "lg"
          },
          {
            type: "text",
            text: `${new Date(c.updatedAt || c.createdAt).toLocaleString("th-TH", {
              timeZone: "Asia/Bangkok",
              year: "numeric",
              month: "long",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            })} น.`,
            size: "xs",
            align: "center",
            color: "#aaaaaa"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "ผู้แจ้ง", color: "#aaaaaa", size: "sm", flex: 2 },
                  { type: "text", text: c.reporterName, color: "#666666", size: "sm", wrap: true, flex: 5 }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "เบอร์", color: "#aaaaaa", size: "sm", flex: 2 },
                  { type: "text", text: c.phone || "ไม่ระบุ", color: "#666666", size: "sm", wrap: true, flex: 5 }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "รายละเอียด", color: "#aaaaaa", size: "sm", flex: 2 },
                  { type: "text", text: c.description, color: "#666666", size: "sm", wrap: true, flex: 5 }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "พิกัด", size: "sm", color: "#aaaaaa", flex: 2 },
                  {
                    type: "text",
                    text: "เปิดใน Google Maps",
                    size: "sm",
                    color: "#155dfc",
                    flex: 5,
                    action: {
                      type: "uri",
                      label: "map",
                      uri: mapUrl,
                      altUri: {
                        desktop: mapUrl
                      }
                    },
                    decoration: "underline"
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "สถานะ", size: "sm", color: "#aaaaaa", flex: 2 },
                  {
                    type: "text",
                    text: "เสร็จสิ้น",
                    size: "sm",
                    color: "#3bb273",
                    weight: "bold",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "สรุปผล", size: "sm", color: "#aaaaaa", flex: 2 },
                  {
                    type: "text",
                    text: message || "ไม่ระบุ",
                    size: "sm",
                    color: "#666666",
                    wrap: true,
                    flex: 5
                  }
                ]
              }
            ]
          },
          { type: "separator", margin: "md" },
          {
            type: "text",
            text: "เรื่องร้องเรียนของคุณได้รับการดำเนินการแล้ว",
            weight: "bold",
            align: "center",
            wrap: true,
            margin: "lg"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียด",
              uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
            }
          }
        ],
        flex: 0
      }
    }
  }
}

function buildGroupFlexReport(c: Complaint, message: string) {
  const mapUrl = c.location
    ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
    : "https://www.google.com/maps";

  const sourceColor: Record<ComplaintSource, string> = {
    LINE: "#00c300",
    FACEBOOK: "#1877f2",
    PHONE: "#f59e0b",
    COUNTER: "#9333ea",
    OTHER: "#6b7280",
  };

  const isLine = c.source === "LINE";

  return {
    type: "flex",
    altText: `📌 เรื่อง ID ${c.id.slice(0, 8)}... ดำเนินการเสร็จแล้ว`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
            size: "sm"
          },
          {
            type: "text",
            text: "เรื่องร้องเรียน (เสร็จสิ้น)",
            weight: "bold",
            size: "lg",
            align: "center",
            margin: "lg"
          },
          {
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "ช่องทาง:",
                color: "#aaaaaa",
                size: "sm",
                flex: 0
              },
              {
                type: "text",
                text: c.source,
                color: sourceColor[c.source],
                size: "sm",
                margin: "sm",
                flex: 0,
                weight: "bold"
              }
            ],
            justifyContent: "center",
            alignItems: "center"
          },
          {
            type: "text",
            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
            size: "sm",
            weight: "bold",
            align: "center",
            margin: "lg"
          },
          {
            type: "text",
            text: `${new Date(c.updatedAt || c.createdAt).toLocaleString("th-TH", {
              timeZone: "Asia/Bangkok",
              year: "numeric",
              month: "long",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            })} น.`,
            size: "xs",
            align: "center",
            color: "#aaaaaa"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "ผู้แจ้ง", color: "#aaaaaa", size: "sm", flex: 2 },
                  { type: "text", text: c.reporterName || c.lineUserId, color: "#666666", size: "sm", wrap: true, flex: 5 }
                ]
              },
              !isLine && c.receivedBy && {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ผู้รับแจ้ง",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 2
                  },
                  {
                    type: "text",
                    text: c.receivedBy,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "เบอร์", color: "#aaaaaa", size: "sm", flex: 2 },
                  { type: "text", text: c.phone || "ไม่ระบุ", color: "#666666", size: "sm", wrap: true, flex: 5 }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  { type: "text", text: "รายละเอียด", color: "#aaaaaa", size: "sm", flex: 2 },
                  { type: "text", text: c.description, color: "#666666", size: "sm", wrap: true, flex: 5 }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "พิกัด", size: "sm", color: "#aaaaaa", flex: 2 },
                  {
                    type: "text",
                    text: "เปิดใน Google Maps",
                    size: "sm",
                    color: "#155dfc",
                    flex: 5,
                    action: {
                      type: "uri",
                      label: "action",
                      uri: mapUrl,
                      altUri: { desktop: mapUrl }
                    },
                    decoration: "underline"
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "สถานะ", size: "sm", color: "#aaaaaa", flex: 2 },
                  {
                    type: "text",
                    text: "เสร็จสิ้น",
                    size: "sm",
                    color: "#3bb273",
                    weight: "bold",
                    flex: 5
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "สรุปผล", size: "sm", color: "#aaaaaa", flex: 2 },
                  {
                    type: "text",
                    text: message || "ไม่ระบุ",
                    size: "sm",
                    color: "#666666",
                    wrap: true,
                    flex: 5
                  }
                ]
              },
            ]
          },
          { type: "separator", margin: "md" },
          {
            type: "text",
            text: "เรื่องร้องเรียนนี้ได้รับการดำเนินการแล้ว",
            wrap: true,
            weight: "bold",
            align: "center",
            margin: "xl"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียด",
              uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
            }
          }
        ],
        flex: 0
      }
    }
  }
}