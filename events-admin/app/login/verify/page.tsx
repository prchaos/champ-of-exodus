import { redirect } from "next/navigation";

import { TotpVerifyForm } from "@/components/auth/totp-verify-form";
import { getPendingSession } from "@/lib/session";

export default async function VerifyPage() {
  const pending = await getPendingSession();
  if (!pending.adminId || pending.stage !== "verify") {
    redirect("/login");
  }

  return (
    <main className="card">
      <h1>Enter your authenticator code</h1>
      <p>Open Google Authenticator or Microsoft Authenticator and enter the current 6-digit code.</p>
      <TotpVerifyForm />
    </main>
  );
}
