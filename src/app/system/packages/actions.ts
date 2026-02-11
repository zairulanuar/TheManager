"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type State = {
  error?: string | null;
  success?: boolean;
  message?: string | null;
};

export async function createPackage(prevState: State, formData: FormData): Promise<State> {
  const name = formData.get("name") as string;
  const monthlyPrice = parseFloat(formData.get("monthlyPrice") as string);
  const userLimit = parseInt(formData.get("userLimit") as string);
  const companyLimit = parseInt(formData.get("companyLimit") as string);
  const allowedModulesRaw = formData.get("allowedModules") as string;
  
  // Handle empty or missing modules
  const allowedModules = allowedModulesRaw 
    ? allowedModulesRaw.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  if (!name || isNaN(monthlyPrice)) {
    return { error: "Name and Price are required", success: false };
  }

  try {
    await db.package.create({
      data: {
        name,
        monthlyPrice,
        userLimit,
        companyLimit,
        allowedModules
      }
    });

    revalidatePath("/system/packages");
    return { success: true, message: "Package created successfully" };
  } catch (error) {
    console.error("Failed to create package:", error);
    return { error: "Failed to create package", success: false };
  }
}

export async function deletePackage(packageId: string) {
    try {
        await db.package.delete({
            where: { id: packageId }
        });
        revalidatePath("/system/packages");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete package" };
    }
}
