import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, Building2, MoreHorizontal, Globe, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { Organization } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { OrganizationActions } from "./organization-actions";

export default async function OrganizationsPage() {
  const organizations = await db.organization.findMany({
    orderBy: { name: 'asc' },
    include: {
        _count: {
            select: { moduleConfigs: true }
        }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground">
            Manage your tenants and their subscriptions.
          </p>
        </div>
        <Link href="/system/organizations/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Tenant
          </Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No organizations found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                Get started by creating your first tenant organization. They will be able to manage their own settings.
            </p>
            <Link href="/system/organizations/create">
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tenant
                </Button>
            </Link>
        </Card>
      ) : (
        <Card>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {organizations.map((org: Organization & { _count: { moduleConfigs: number } }) => (
                <TableRow key={org.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={org.logo || ""} alt={org.name} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {org.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold">{org.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {org.website || "No website"}
                                </div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded w-fit">
                            {org.slug}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                            {org.contactPerson && (
                                <div className="flex items-center gap-2 font-medium">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    {org.contactPerson}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {org.email || "No email"}
                            </div>
                            {org.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {org.phone}
                                </div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <OrganizationActions orgId={org.id} />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </Card>
      )}
    </div>
  );
}
