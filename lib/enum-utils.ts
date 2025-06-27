import { ComplaintSource, ComplaintStatus } from "@prisma/client";

export function isValidComplaintStatus(value: any): value is ComplaintStatus {
  return ["PENDING", "DONE"].includes(value);
}

export function isValidComplaintSource(value: any): value is ComplaintSource {
  return ["LINE", "FACEBOOK", "PHONE", "COUNTER", "OTHER"].includes(value);
}