import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { TotpEnroll } from "@/components/auth/totp-enroll";
import { buildOtpauthUrl } from "@/lib/auth/totp";
import { adminPrisma } from "@/lib/prisma/admin-client";
import { getPendingSession } from "@/lib/session";

export default async function EnrollPage() {
  const pending = await getPendingSession();
  if (!pending.adminId || pending.stage !== "enroll" || !pending.totpSecret) {
    redirect("/login");
  }

  const admin = await adminPrisma.adminUser.findUnique({ where: { id: pending.adminId } });
  if (!admin) {
    redirect("/login");
  }

  const otpauthUrl = buildOtpauthUrl(pending.totpSecret, admin.username);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return (
    <main className="card">
      <h1>Set up multi-factor authentication</h1>
      <p>
        Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter the
        current code to confirm.
      </p>
      <TotpEnroll secret={pending.totpSecret} qrDataUrl={qrDataUrl} />
    </main>
  );
}
