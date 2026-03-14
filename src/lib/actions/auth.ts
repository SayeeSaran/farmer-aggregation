"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/utils/validators";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role") || "FARMER",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with this email already exists." };

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
      phone: parsed.data.phone,
      role: parsed.data.role as "FARMER" | "AGGREGATOR",
    },
  });

  return { success: true };
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "An error occurred. Please try again." };
      }
    }
    throw error;
  }
}
