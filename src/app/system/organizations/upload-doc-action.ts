"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function uploadOrganizationDoc(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate file type (Images + PDF)
  const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    return { error: "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed." };
  }

  // Ensure directory exists (SECURE STORAGE)
  // We now store in storage/private instead of public/uploads
  const uploadDir = join(process.cwd(), "storage/private/organizations/documents");
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
    // Return API URL for secure access
    // The frontend will use this URL to fetch the file via the API route
    // The API route will enforce authentication
    return { success: true, url: `/api/secure-files?file=organizations/documents/${filename}` };
  } catch (error) {
    console.error("Error saving file:", error);
    return { error: "Failed to save file" };
  }
}
