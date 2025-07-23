export type Complaint = {
  id: string;
  source: ComplaintSource;
  receivedBy?: string;
  reporterName?:   String;
  lineUserId?: string;
  phone?: string;
  description: string;
  imageBefore?: string;
  imageAfter?: string;
  location: string;
  status: 'PENDING' | 'DONE' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | 'REOPENED';
  message?: string;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

enum ComplaintSource {
  LINE = "LINE",
  FACEBOOK = "FACEBOOK",
  PHONE = "PHONE",
  COUNTER = "COUNTER",
  OTHER = "OTHER",
}