import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile, stat } from "fs/promises";
import { getSessionContext } from "@/core/services/auth-service";

export async function GET(request: NextRequest) {
  // 1. Auth Check
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("file");

  if (!filePath) {
    return NextResponse.json({ error: "No file specified" }, { status: 400 });
  }

  // Prevent directory traversal and ensure we only serve from specific directories
  // We allow subdirectories, but strictly under storage/private
  if (filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const storageRoot = join(process.cwd(), "storage/private");
  const absolutePath = join(storageRoot, filePath);

  // Double check the resolved path
  if (!absolutePath.startsWith(storageRoot)) {
     return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    // Check if file exists
    await stat(absolutePath);

    const fileBuffer = await readFile(absolutePath);
    
    // Determine mime type manually to avoid external deps if possible
    const ext = absolutePath.split('.').pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "txt") contentType = "text/plain";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        // "Content-Disposition": `inline; filename="${filePath.split('/').pop()}"` // Optional: force download vs inline
      },
    });

  } catch (error) {
    console.error("Secure file read error:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
