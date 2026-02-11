import AdmZip from "adm-zip";
import path from "path";
import { db } from "@/lib/db";

export async function installModule(fileBuffer: Buffer, orgId: string) {
    const zip = new AdmZip(fileBuffer);
    const manifest = JSON.parse(zip.getEntry("module.json")!.getData().toString("utf8"));
    zip.extractAllTo(path.join(process.cwd(), "src/modules", manifest.id), true);
    return await db.moduleConfig.upsert({
        where: { organizationId_moduleKey: { organizationId: orgId, moduleKey: manifest.id } },
        update: { isEnabled: true, metadata: manifest.navItems },
        create: { organizationId: orgId, moduleKey: manifest.id, isEnabled: true, metadata: manifest.navItems }
    });
}