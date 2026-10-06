"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { login } from "@/lib/actions/auth";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const result = await login(values);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    router.push(result.next === "enroll" ? "/enroll" : "/login/verify");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="username">Username</label>
      <input id="username" autoComplete="username" {...register("username")} />
      {errors.username && <p className="field-error">{errors.username.message}</p>}

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        {...register("password")}
      />
      {errors.password && <p className="field-error">{errors.password.message}</p>}

      {formError && <p className="form-error">{formError}</p>}

      <div className="modal-actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </div>
    </form>
  );
}
