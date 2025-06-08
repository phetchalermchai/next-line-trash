export type Complaint = {
  id: string;
  lineUserId: string;
  lineDisplayName?: string;
  phone?: string;
  description: string;
  imageBefore: string;
  imageAfter?: string;
  location: string;
  status: "PENDING" | "DONE";
  message?: string;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};