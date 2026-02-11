import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import KycDetailsView from "./details";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CompanyKycDetailsPage({ params }: PageProps) {
  const record = await db.kycRecord.findUnique({
    where: { id: params.id },
    include: {
      organization: true,
      auditLogs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!record) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/system/kyc/company">
            <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
            </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Details</h1>
          <p className="text-muted-foreground">
            Reviewing submission for <span className="font-semibold text-foreground">{record.organization.name}</span>
          </p>
        </div>
      </div>
      
      <KycDetailsView record={record} />
    </div>
  );
}
