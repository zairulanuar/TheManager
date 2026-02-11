import { db } from "@/lib/db";

export const QuotaService = {
  async canCreateCompany(accountId: string) {
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: { _count: { select: { organizations: true } } }
    });
    return account ? account._count.organizations < account.companyLimit : false;
  }
};