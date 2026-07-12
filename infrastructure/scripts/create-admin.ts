/**
 * create-admin.ts
 *
 * Creates an admin user in the database.
 *
 * Usage:
 *   pnpm tsx infrastructure/scripts/create-admin.ts <email> <password> [username]
 *
 * If username is omitted, the part before @ in the email is used.
 *
 * Example:
 *   pnpm tsx infrastructure/scripts/create-admin.ts admin@devpilot.dev secret123 admin
 */

import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env
const envPath = resolve(process.cwd(), "apps", "backend", ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: pnpm tsx infrastructure/scripts/create-admin.ts <email> <password> [username]");
    process.exit(1);
  }

  const email = args[0].toLowerCase().trim();
  const password = args[1];
  const username = (args[2] || email.split("@")[0]).trim();

  if (!email.includes("@")) {
    console.error("Invalid email address.");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }
  if (username.length < 2) {
    console.error("Username must be at least 2 characters.");
    process.exit(1);
  }

  // Check if user already exists
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    if (existing.email === email) {
      console.error(`User with email "${email}" already exists.`);
    } else {
      console.error(`User with username "${username}" already exists.`);
    }
    await prisma.$disconnect();
    process.exit(1);
  }

  // Create user with admin role
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: hashPassword(password),
    },
  });

  console.log("Admin user created successfully:");
  console.log(`  ID:       ${user.id}`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Username: ${user.username}`);

  // Note: The schema currently has no `role` field.
  // If you add a role column, update the create above to include:
  //   role: "admin",
  console.log("\n⚠  The current Prisma schema has no `role` field.");
  console.log("   This script creates a regular user.");
  console.log("   To restrict admin access, add a `role` column to the User model and migrate.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e);
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
