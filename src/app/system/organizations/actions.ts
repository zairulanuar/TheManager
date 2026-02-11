"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    include: { 
        account: true,
        role: true 
    }
  });
}

export async function createOrganization(formData: FormData) {
  const user = await getSessionUser();
  
  if (!user) {
    return { error: "You must be logged in to create an organization" };
  }

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const email = formData.get("email") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const website = formData.get("website") as string;
  const logo = formData.get("logo") as string;
  
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
  
  // Advanced SSM Fields
  const natureOfBusiness = formData.get("natureOfBusiness") as string;
  const shareCapitalRaw = formData.get("shareCapital") as string;
  const financialsRaw = formData.get("financials") as string;
  const directorsRaw = formData.get("directors") as string;
  const shareholdersRaw = formData.get("shareholders") as string;
  const chargesRaw = formData.get("charges") as string;
  const kycRiskAssessmentRaw = formData.get("kycRiskAssessment") as string;

  const shareCapital = shareCapitalRaw ? JSON.parse(shareCapitalRaw) : null;
  const financials = financialsRaw ? JSON.parse(financialsRaw) : null;
  const directors = directorsRaw ? JSON.parse(directorsRaw) : null;
  const shareholders = shareholdersRaw ? JSON.parse(shareholdersRaw) : null;
  const charges = chargesRaw ? JSON.parse(chargesRaw) : null;
  const kycRiskAssessment = kycRiskAssessmentRaw ? JSON.parse(kycRiskAssessmentRaw) : null;

  if (!name || !slug) {
    return { error: "Name and Slug are required" };
  }

  // Check if slug exists
  const existingOrg = await db.organization.findUnique({
    where: { slug }
  });

  if (existingOrg) {
    return { error: "This slug is already taken. Please choose another." };
  }

  let accountId = user.accountId;

  // If user has no account, create one (Auto-provisioning for first usage)
  if (!accountId) {
    const newAccount = await db.account.create({
      data: {
        name: name + " Account",
        slug: slug + "-account", // Ensure unique slug for account too
      }
    });
    
    // Link user to this new account (Auto-provisioning)
    await db.user.update({
      where: { id: user.id },
      data: { accountId: newAccount.id }
    });
    
    accountId = newAccount.id;
  }

  try {
    const newOrg = await db.organization.create({
      data: {
        name,
        slug,
        email: email || null,
        contactPerson: contactPerson || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        logo: logo || null,
        currency,
        currencySymbol,
        // @ts-ignore
        currencies: {
            connect: selectedCurrencies.map(code => ({ code }))
        },
        businessRegNumber: businessRegNumber || null,
        taxIdNumber: taxIdNumber || null,
        sstRegNumber: sstRegNumber || null,
        tourismTaxRegNumber: tourismTaxRegNumber || null,
        msicCode: msicCode || null,
        businessDesc: businessDesc || null,
        // @ts-ignore
        ssmCert: ssmCert || null,
        oldRegNumber: oldRegNumber || null,
        companyType: companyType || null,
        incorpDate: incorpDate || null,
        validUntil: validUntil || null,
        registeredAddress: registeredAddress || null,
        branchAddresses: branchAddresses,
        issuePlace: issuePlace || null,
        issueDate: issueDate || null,
        
        natureOfBusiness: natureOfBusiness || null,
        shareCapital: shareCapital || null,
        financials: financials || null,
        directors: directors || null,
        shareholders: shareholders || null,
        charges: charges || null,
        kycRiskAssessment: kycRiskAssessment || null,

        accountId: accountId!,
      }
    });

    // Concurrent KYC Record Creation
    if (ssmCert) {
        // Prepare extracted data structure for KYC
        // We reconstruct the JSON that would have been extracted
        const extractedData = {
            docType: "SSM_CERT", // Assumed default if not passed explicitly, or we could pass it in form
            companyName: name,
            registrationNumber: businessRegNumber,
            oldRegistrationNumber: oldRegNumber,
            incorporationDate: incorpDate,
            registeredAddress: {
                 address: registeredAddress
            },
            businessAddress: {
                 address: address
            },
            companyType: companyType,
            status: validUntil ? "ACTIVE" : "UNKNOWN",
            // Include other fields
            natureOfBusiness: natureOfBusiness,
            directors: directors,
            shareholders: shareholders,
            charges: charges,
            financials: financials,
            shareCapital: shareCapital
        };

        await db.kycRecord.create({
            data: {
                organizationId: newOrg.id,
                type: "COMPANY",
                status: "PENDING",
                documentUrl: ssmCert,
                documentType: "SSM_CERT",
                extractedData: extractedData,
                remarks: "Auto-created upon organization registration"
            }
        });
    }

    revalidatePath("/system/organizations");
    return { success: true };
  } catch (error) {
    console.error("Failed to create organization:", error);
    return { error: "Failed to create organization. Please try again." };
  }
}

export async function deleteOrganization(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  
  // Check Super Admin
  const isSuperAdmin = user.role?.type === 'SUPER_ADMIN' || 
      // @ts-ignore
      user.roleType === 'SUPER_ADMIN' || 
      // @ts-ignore
      user.role === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
      const org = await db.organization.findUnique({ where: { id } });
      if (!org || org.accountId !== user.accountId) {
          return { error: "Unauthorized" };
      }
  }

  try {
      await db.organization.delete({ where: { id } });
      revalidatePath("/system/organizations");
      return { success: true };
  } catch (error) {
      console.error("Failed to delete organization:", error);
      return { error: "Failed to delete organization" };
  }
}
