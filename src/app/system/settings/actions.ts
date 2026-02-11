"use server";
import { installModule } from "@/core/services/installer-service";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function uploadModuleAction(formData: FormData) {
  const file = formData.get("moduleZip") as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  const org = await db.organization.findFirst(); // Get first org to test
  if (org) await installModule(buffer, org.id);
  revalidatePath("/");
}

export async function getSystemSettingsAction() {
  const settings = await db.systemSetting.findMany();
  return settings;
}

export async function updateSystemSettingsBatchAction(settings: { key: string; value: string; group?: string; isSecret?: boolean }[]) {
  await db.$transaction(
    settings.map((s) =>
      db.systemSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, group: s.group ?? 'GENERAL', isSecret: s.isSecret ?? false },
        create: { key: s.key, value: s.value, group: s.group ?? 'GENERAL', isSecret: s.isSecret ?? false },
      })
    )
  );
  revalidatePath("/system/settings");
}