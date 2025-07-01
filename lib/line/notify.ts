import axios from "axios";
import { prisma } from "@/lib/prisma";
import { getSettingByKey } from "@/lib/settings/service";
import { Complaint, ComplaintSource, ComplaintStatus } from "@prisma/client";

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
  };

  const statusLabel: Record<ComplaintStatus, string> = {
    PENDING: "รอดำเนินการ",
    DONE: "เสร็จสิ้น",
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
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "แจ้งผลดำเนินงาน",
              uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}/report`
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
  };

  const statusColor: Record<ComplaintStatus, string> = {
    PENDING: "#efb100",
    DONE: "#3bb273",
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
            text: "ระบบได้รับเรื่องร้องเรียนของคุณแล้ว",
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