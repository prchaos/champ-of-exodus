import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { SignInButton } from "./sign-in-button";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <main className="card">
      <h1>Sign In</h1>
      <p>Sign in with your Discord account to join Champ of Exodus.</p>
      <div style={{ marginTop: "0.75rem" }}>
        <SignInButton />
      </div>
    </main>
  );
}
