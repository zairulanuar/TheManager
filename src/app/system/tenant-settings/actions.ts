"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    include: {
      account: {
        include: {
          organizations: {
            include: {
              paymentGateways: {
                orderBy: { createdAt: 'asc' }
              },
              // @ts-ignore
              currencies: true
            }
          }
        }
      }
    }
  });
}

export async function getTenantData() {
  const user = await getSessionUser();
  if (!user || !(user as any).account) {
    return { error: "No account found" };
  }
  
  // Return the first organization for now, or all of them
  return { 
    account: (user as any).account, 
    organizations: (user as any).account.organizations 
  };
}

export type UpdateState = {
    success?: boolean;
    error?: string | null;
    message?: string | null;
};

export async function updateOrganization(prevState: UpdateState, formData: FormData): Promise<UpdateState> {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const website = formData.get("website") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const logo = formData.get("logo") as string; // URL for now
  
  // Branding
  const currenciesJson = formData.get("currencies") as string;
  const selectedCurrencies: string[] = currenciesJson ? JSON.parse(currenciesJson) : [];
  
  // Default legacy fields to first selected currency or USD
  let currency = "USD";
  let currencySymbol = "$";
  
  if (selectedCurrencies.length > 0) {
      // @ts-ignore
      const firstCurrency = await db.currency.findUnique({ where: { code: selectedCurrencies[0] } });
      if (firstCurrency) {
          currency = firstCurrency.code;
          currencySymbol = firstCurrency.symbol;
      }
  }

  // Malaysian Business Details
  const businessRegNumber = formData.get("businessRegNumber") as string;
  const taxIdNumber = formData.get("taxIdNumber") as string;
  const sstRegNumber = formData.get("sstRegNumber") as string;
  const tourismTaxRegNumber = formData.get("tourismTaxRegNumber") as string;
  const msicCode = formData.get("msicCode") as string;
  const businessDesc = formData.get("businessDesc") as string;
  const ssmCert = formData.get("ssmCert") as string;

  // Extended SSM Fields
  const oldRegNumber = formData.get("oldRegNumber") as string;
  const companyType = formData.get("companyType") as string;
  const incorpDate = formData.get("incorpDate") as string;
  const validUntil = formData.get("validUntil") as string;
  const registeredAddress = formData.get("registeredAddress") as string;
  const branchAddressesRaw = formData.get("branchAddresses") as string;
  const branchAddresses = branchAddressesRaw ? branchAddressesRaw.split("\n").filter(l => l.trim()) : [];
  const issuePlace = formData.get("issuePlace") as string;
  const issueDate = formData.get("issueDate") as string;

  if (!id || !name) {
    return { error: "Name is required", success: false };
  }

  try {
    await db.organization.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        website,
        contactPerson,
        logo,
        currency,
        currencySymbol,
        // @ts-ignore
        currencies: {
            set: [], // Clear existing relations
            connect: selectedCurrencies.map(code => ({ code }))
        },
        businessRegNumber,
        taxIdNumber,
        sstRegNumber,
        tourismTaxRegNumber,
        msicCode,
        businessDesc,
        // @ts-ignore
        ssmCert,
        oldRegNumber,
        companyType,
        incorpDate,
        validUntil,
        registeredAddress,
        branchAddresses,
        issuePlace,
        issueDate
      } as any
    });

    revalidatePath("/system/tenant-settings");
    return { success: true, message: "Settings updated successfully" };
  } catch (error) {
    console.error("Failed to update organization:", error);
    return { error: "Failed to update settings", success: false };
  }
}
