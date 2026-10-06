"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/actions/auth";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

/**
 * Proactive, client-side-only UX: logs out an inactive tab on its own
 * instead of waiting for the next request to hit middleware.ts. The
 * server-side idle check there is the actual enforcement — this timer
 * cannot extend a session past what that allows.
 */
export function IdleTimeoutProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout().catch(() => {
          router.push("/login?reason=idle");
        });
      }, IDLE_TIMEOUT_MS);
    }

    resetTimer();
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, resetTimer);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, resetTimer);
    };
  }, [router]);

  return <>{children}</>;
}
