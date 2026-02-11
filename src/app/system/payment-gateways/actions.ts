"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();


export async function getPaymentGateways(organizationId?: string) {
  try {
    const gateways = await prisma.paymentGateway.findMany({
      where: {
        organizationId: organizationId || null,
      },
      orderBy: { createdAt: "asc" },
    });
    return gateways;
  } catch (error) {
    console.error("Failed to fetch payment gateways:", error);
    return [];
  }
}

export async function upsertPaymentGateway(data: {
  id?: string;
  name: string;
  isEnabled: boolean;
  config: string; // JSON string
  isDefault: boolean;
  organizationId?: string;
}) {
  try {
    let configJson = {};
    try {
      configJson = JSON.parse(data.config);
    } catch (e) {
      return { error: "Invalid JSON configuration" };
    }

    const orgId = data.organizationId || null;

    if (data.isDefault) {
      // Unset other defaults if this one is set to default for this scope
      await prisma.paymentGateway.updateMany({
        where: { 
          isDefault: true,
          organizationId: orgId
        },
        data: { isDefault: false },
      });
    }

    if (data.id) {
      await prisma.paymentGateway.update({
        where: { id: data.id },
        data: {
          name: data.name,
          isEnabled: data.isEnabled,
          config: configJson,
          isDefault: data.isDefault,
          organizationId: orgId,
        },
      });
    } else {
      await prisma.paymentGateway.create({
        data: {
          name: data.name,
          isEnabled: data.isEnabled,
          config: configJson,
          isDefault: data.isDefault,
          organizationId: orgId,
        },
      });
    }

    revalidatePath("/system/payment-gateways");
    if (orgId) {
       // We'll revalidate the organization settings page too, 
       // but we don't have the exact path here easily without fetching the slug.
       // For now, simple revalidation is okay.
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to upsert payment gateway:", error);
    return { error: "Failed to save payment gateway" };
  }
}

export async function setDefaultGateway(id: string, organizationId?: string) {
  try {
    const orgId = organizationId || null;

    // Unset other defaults in the same scope
    await prisma.paymentGateway.updateMany({
      where: { 
        isDefault: true,
        organizationId: orgId
      },
      data: { isDefault: false },
    });

    // Set the selected gateway as default
    await prisma.paymentGateway.update({
      where: { id },
      data: { isDefault: true, isEnabled: true }, // Also enable it if it's default
    });

    revalidatePath("/system/payment-gateways");
    return { success: true };
  } catch (error) {
    console.error("Failed to set default payment gateway:", error);
    return { error: "Failed to set default payment gateway" };
  }
}

export async function deletePaymentGateway(id: string) {
  try {
    await prisma.paymentGateway.delete({
      where: { id },
    });
    revalidatePath("/system/payment-gateways");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete payment gateway:", error);
    return { error: "Failed to delete payment gateway" };
  }
}
