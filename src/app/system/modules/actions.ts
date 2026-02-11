"use server";

import { installModule } from "@/core/services/installer-service";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

export async function uploadModuleAction(formData: FormData) {
  const file = formData.get("moduleZip") as File;
  if (!file) return { error: "No file provided" };

  try {
      const buffer = Buffer.from(await file.arrayBuffer());
      // For now, we still install to the first org as a test/default behavior
      // In a real system, we might just extract it to src/modules without enabling it for an org
      // But installModule currently does both.
      
      const org = await db.organization.findFirst();
      if (org) {
        await installModule(buffer, org.id);
        revalidatePath("/system/modules");
        return { success: true, message: "Module installed successfully" };
      } else {
        return { error: "No organization found to install module into" };
      }
  } catch (error) {
      console.error("Failed to install module:", error);
      return { error: "Failed to install module" };
  }
}

export async function getInstalledModules() {
    const modulesDir = path.join(process.cwd(), "src/modules");
    
    if (!fs.existsSync(modulesDir)) {
        return [];
    }

    const modules = [];
    const entries = fs.readdirSync(modulesDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const manifestPath = path.join(modulesDir, entry.name, "module.json");
            if (fs.existsSync(manifestPath)) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
                    modules.push({
                        id: entry.name,
                        name: manifest.name || entry.name,
                        version: manifest.version || "0.0.0",
                        description: manifest.description || "No description",
                        author: manifest.author || "Unknown"
                    });
                } catch (e) {
                    console.error(`Failed to parse manifest for ${entry.name}`, e);
                    modules.push({ id: entry.name, name: entry.name, error: "Invalid manifest" });
                }
            } else {
                modules.push({ id: entry.name, name: entry.name, error: "No manifest found" });
            }
        }
    }
    return modules;
}
