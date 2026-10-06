import { redirect } from "next/navigation";

import { IdleTimeoutProvider } from "@/components/auth/idle-timeout-provider";
import { CreateEventTab } from "@/components/events/create-event-tab";
import { EditEventTab } from "@/components/events/edit-event-tab";
import { WelcomeBanner } from "@/components/layout/welcome-banner";
import { getValidSession } from "@/lib/session";

// Reads live session/event state — shouldn't be prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // middleware.ts already gates /dashboard/**; this is a defensive backstop.
  const session = await getValidSession();
  if (!session) redirect("/login");

  return (
    <IdleTimeoutProvider>
      <main>
        <WelcomeBanner />
        <CreateEventTab />
        <EditEventTab />
      </main>
    </IdleTimeoutProvider>
  );
}
