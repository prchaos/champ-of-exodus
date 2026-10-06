"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { verifyTotp } from "@/lib/actions/auth";
import { totpCodeSchema, type TotpCodeValues } from "@/lib/validations/auth";

export function TotpVerifyForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpCodeValues>({ resolver: zodResolver(totpCodeSchema) });

  async function onSubmit(values: TotpCodeValues) {
    setFormError(null);
    // On success this redirects server-side and never resolves normally.
    const result = await verifyTotp(values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="code">Authenticator code</label>
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
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </form>
  );
}
