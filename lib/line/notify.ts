import axios from "axios";
import { prisma } from "@/lib/prisma";
import { getSettingByKey } from "@/lib/settings/service";

export async function notifyUserAndGroup(id: string) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new Error("Complaint not found");
    if (!complaint.lineUserId) throw new Error("Missing lineUserId");

    const groupSetting = await getSettingByKey("LINE_GROUP_ID");
    const tokenSetting = await getSettingByKey("LINE_ACCESS_TOKEN");

    if (!groupSetting || !tokenSetting) throw new Error("LINE_GROUP_ID หรือ LINE_ACCESS_TOKEN ไม่พบใน DB");

    const flexGroup = buildGroupFlex(complaint, "ใหม่");
    const flexUser = buildUserFlex(complaint);
    
    await pushMessageToGroup(groupSetting.value, [flexGroup], tokenSetting.value);
    await pushMessageToUser(complaint.lineUserId, [flexUser], tokenSetting.value);
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
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function pushMessageToUser(userId: string, messages: any[], token: string) {
  await axios.post(
    "https://api.line.me/v2/bot/message/push",
    { to: userId, messages },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

function buildGroupFlex(c: any, type: string = "ใหม่") {
  return {
    type: "text",
    text: `📌 เรื่องร้องเรียน (${type}): #${c.id.slice(-6).toUpperCase()}\n- ${c.description}`,
  };
}

function buildUserFlex(c: any) {
  return {
    type: "text",
    text: `📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว\nรหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}\n- ${c.description}`,
  };
}