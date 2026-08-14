export { default } from "next-auth/middleware";

export const config = {
  // No routes require auth yet. Phase 3 (profiles) and Phase 6 (admin)
  // will populate this matcher as protected pages are added.
  matcher: [],
};
