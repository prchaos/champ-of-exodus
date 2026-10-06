import { redirect } from "next/navigation";

import { getValidSession } from "@/lib/session";

export default async function RootPage() {
  const session = await getValidSession();
  redirect(session ? "/dashboard" : "/login");
}
