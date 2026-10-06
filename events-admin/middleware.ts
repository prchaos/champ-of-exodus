import { NextResponse, type NextRequest } from "next/server";

import { IDLE_TIMEOUT_MS, getSessionForMiddleware } from "@/lib/session";

export const config = {
  matcher: ["/dashboard/:path*"],
};

// Server-side enforcement is the source of truth for the 15-minute idle
// timeout — the client-side IdleTimeoutProvider is UX-only and cannot
// extend a session past what this check allows, since lastActivityAt only
// ever gets updated here.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getSessionForMiddleware(request, response);

  if (!session.adminId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (Date.now() - session.lastActivityAt > IDLE_TIMEOUT_MS) {
    session.destroy();
    await session.save();
    const redirectResponse = NextResponse.redirect(new URL("/login?reason=idle", request.url));
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  session.lastActivityAt = Date.now();
  await session.save();
  return response;
}
