import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import type { User } from "@devpilot/shared";
import { config } from "../config.js";

const prisma = new PrismaClient();

function toUserResponse(user: { id: string; email: string; username: string; role: string; createdAt: Date }): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

function signToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: "7d" });
}

export class AuthService {
  async register(email: string, username: string, password: string) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new Error("Email already registered");

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new Error("Username already taken");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    });

    return { user: toUserResponse(user), token: signToken(user.id) };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    return { user: toUserResponse(user), token: signToken(user.id) };
  }

  async getMe(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    return toUserResponse(user);
  }
}
