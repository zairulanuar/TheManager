import { CreateOrganizationForm } from "@/app/system/organizations/create/create-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

export default async function CreateOrganizationPage() {
  // @ts-ignore
  const currencies = await db.currency.findMany({
    orderBy: { code: 'asc' }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/system/organizations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Organization</h2>
          <p className="text-muted-foreground">
            Add a new organization to the system.
          </p>
        </div>
      </div>

      <CreateOrganizationForm currencies={currencies} />
    </div>
  );
}
