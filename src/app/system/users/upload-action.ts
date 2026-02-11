"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { error: "Invalid file type. Only images are allowed." };
  }

  // Ensure directory exists
  const uploadDir = join(process.cwd(), "public/uploads/avatars");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
  }

  // Generate unique filename
  const ext = file.name.split(".").pop();
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(uploadDir, filename);

  try {
    await writeFile(filepath, buffer);
    // Return relative path for public access
    return { success: true, url: `/uploads/avatars/${filename}` };
  } catch (error) {
    console.error("Error saving file:", error);
    return { error: "Failed to save file" };
  }
}
