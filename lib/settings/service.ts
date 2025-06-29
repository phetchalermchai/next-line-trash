  // lib/settings/service.ts
import { prisma } from "@/lib/prisma";

export async function getSettingByKey(key: string) {
  return prisma.setting.findUnique({ where: { key } });
}

export async function getAllSettings() {
  return prisma.setting.findMany();
}

export async function updateSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}