// utils/userLabels.ts
export const roleVariants: Record<"SUPERADMIN" | "ADMIN", "default" | "secondary"> = {
  SUPERADMIN: "default",
  ADMIN: "secondary",
};

export const statusColors = {
  APPROVED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  BANNED: "bg-red-100 text-red-800",
};
