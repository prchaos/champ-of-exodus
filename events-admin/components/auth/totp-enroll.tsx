"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { enrollTotp } from "@/lib/actions/auth";
import { totpCodeSchema, type TotpCodeValues } from "@/lib/validations/auth";

export function TotpEnroll({ secret, qrDataUrl }: { secret: string; qrDataUrl: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpCodeValues>({ resolver: zodResolver(totpCodeSchema) });

  async function onSubmit(values: TotpCodeValues) {
    setFormError(null);
    // On success this redirects server-side and never resolves normally.
    const result = await enrollTotp(values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable remote image */}
      <img src={qrDataUrl} alt="Authenticator app QR code" className="qr-code" width={200} height={200} />
      <p>Can&apos;t scan the code? Enter this key manually in your authenticator app:</p>
      <p className="totp-secret">{secret}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="code">Confirm the 6-digit code</label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          {...register("code")}
        />
        {errors.code && <p className="field-error">{errors.code.message}</p>}
        {formError && <p className="form-error">{formError}</p>}
        <div className="modal-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Confirming..." : "Confirm and enable MFA"}
          </Button>
        </div>
      </form>
    </div>
  );
}
