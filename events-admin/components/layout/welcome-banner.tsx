import { LogoutButton } from "@/components/auth/logout-button";
import { getValidSession } from "@/lib/session";

export async function WelcomeBanner() {
  const session = await getValidSession();
  if (!session) return null;

  return (
    <div className="card welcome-banner">
      <h1>Welcome, {session.username}</h1>
      <LogoutButton />
    </div>
  );
}
