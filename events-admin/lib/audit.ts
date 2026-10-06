import { adminPrisma } from "@/lib/prisma/admin-client";

export async function writeAuditLog(entry: {
  adminId: string;
  username: string;
  action: "LOGIN" | "LOGOUT" | "ENROLL_MFA" | "CREATE_EVENT" | "UPDATE_EVENT";
  eventId?: string;
  detail?: string;
}): Promise<void> {
  await adminPrisma.adminAuditLog.create({ data: entry });
}
