import axios from "axios";
import { prisma } from "@/lib/prisma";

export async function notifyUserAndGroup(id: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new Error("Complaint not found");
  if (!complaint.lineUserId) throw new Error("Missing lineUserId");

  const flexGroup = buildGroupFlex(complaint, "ใหม่");
  const flexUser = buildUserFlex(complaint);

  await pushMessageToGroup(process.env.LINE_GROUP_ID!, [flexGroup]);
  await pushMessageToUser(complaint.lineUserId, [flexUser]);
}

export async function notifyGroupOnly(id: string) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new Error("Complaint not found");

  const flexGroup = buildGroupFlex(complaint, "ใหม่");
  await pushMessageToGroup(process.env.LINE_GROUP_ID!, [flexGroup]);
}

async function pushMessageToGroup(groupId: string, messages: any[]) {
  await axios.post(
    "https://api.line.me/v2/bot/message/push",
    { to: groupId, messages },
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function pushMessageToUser(userId: string, messages: any[]) {
  await axios.post(
    "https://api.line.me/v2/bot/message/push",
    { to: userId, messages },
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
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