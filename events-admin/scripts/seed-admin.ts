#!/usr/bin/env tsx
//
// One-time provisioning for the first (or an additional) admin account.
// There is deliberately no self-signup UI — this is the only way to create
// an AdminUser row. Run with ADMIN_DATABASE_URL set, e.g.:
//   ADMIN_DATABASE_URL=postgresql://... npx tsx scripts/seed-admin.ts
//
// The password is only ever entered interactively, never as a CLI argument,
// so it never lands in shell history. MFA enrollment happens on the new
// admin's first real login (see app/enroll/page.tsx), not here.

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { hashPassword } from "../lib/auth/password";
import { adminPrisma } from "../lib/prisma/admin-client";

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  const username = (await rl.question("Admin username: ")).trim();
  if (!username) {
    console.error("Username is required.");
    process.exit(1);
  }

  const existing = await adminPrisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    console.error(`Admin "${username}" already exists.`);
    process.exit(1);
  }

  const password = await rl.question("Admin password (min 12 characters): ");
  const confirmed = await rl.question("Confirm password: ");
  rl.close();

  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  if (password !== confirmed) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const admin = await adminPrisma.adminUser.create({ data: { username, passwordHash } });

  console.log(`Created admin "${admin.username}". MFA enrollment happens on first login.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await adminPrisma.$disconnect();
  });
