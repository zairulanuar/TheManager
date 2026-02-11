"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/core/services/auth-service";

export async function updateKycStatus(recordId: string, status: string, remarks: string) {
  const session = await getSessionContext();
  const userId = session?.userId;
  
  const currentRecord = await db.kycRecord.findUnique({
    where: { id: recordId },
    select: { status: true }
  });

  if (!currentRecord) throw new Error("Record not found");

  // Perform updates in a transaction
  await db.$transaction(async (tx) => {
    // 1. Update the KYC Record
    await tx.kycRecord.update({
      where: { id: recordId },
      data: {
        status,
        remarks, // Update current remarks
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedBy: userId 
      }
    });

    // 2. Create Audit Log Entry
    await tx.kycAuditLog.create({
      data: {
        kycRecordId: recordId,
        action: "STATUS_CHANGE",
        previousStatus: currentRecord.status,
        newStatus: status,
        details: remarks,
        performedBy: userId
      }
    });
  });

  revalidatePath(`/system/kyc/company/${recordId}`);
  revalidatePath(`/system/kyc/company`);
  
  return { success: true };
}
