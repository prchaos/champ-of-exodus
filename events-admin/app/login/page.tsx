import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  return (
    <main className="card">
      <h1>Events Admin Sign In</h1>
      {searchParams.reason === "idle" && (
        <p className="form-error">You were logged out after 15 minutes of inactivity.</p>
      )}
      <p>Sign in with your admin username and password.</p>
      <LoginForm />
    </main>
  );
}
