import { format } from "date-fns";
import { th } from "date-fns/locale";

export function formatThaiDatetime(date: string | Date) {
  const local = new Date(date);
  local.setHours(local.getHours() + 7); // force to GMT+7
  const year = local.getFullYear() + 543;
  return format(local, `dd MMM yyyy เวลา HH:mm`, { locale: th }).replace(`${local.getFullYear()}`, `${year}`);
}
