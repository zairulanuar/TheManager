"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Find the user
  const user = await db.user.findUnique({
    where: { email },
    include: { account: true },
  });

  if (!user) return { error: "Invalid credentials" };

  // 2. Check password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return { error: "Invalid credentials" };

  // 3. Create a simple session cookie (Simplified for Core build)
  const cookieStore = await cookies();
  cookieStore.set("session_user_id", user.id, { httpOnly: true, secure: true });

  // 4. Redirect to the system dashboard
  redirect("/system/dashboard");
}