import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package as PackageIcon } from "lucide-react";
import { CreatePackageForm } from "./create-package-form";
import { getSessionContext } from "@/core/services/auth-service";

export default async function PackagesPage() {
    const session = await getSessionContext();
    const isSuperAdmin = session && (
        session.role?.type === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.roleType === 'SUPER_ADMIN' || 
        // @ts-ignore
        session.role === 'SUPER_ADMIN'
    );

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <PackageIcon className="w-12 h-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                    <p className="text-muted-foreground max-w-[500px]">
                        Package management is restricted to Super Administrators only.
                    </p>
                </div>
            </div>
        );
    }

    const packages = await db.package.findMany({
        orderBy: { monthlyPrice: 'asc' },
        include: { _count: { select: { accounts: true } } }
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Packages</h2>
                    <p className="text-muted-foreground">Manage subscription plans and limits.</p>
                </div>
                <CreatePackageForm />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                    <Card key={pkg.id} className="relative overflow-hidden hover:shadow-lg transition-all border-t-4 border-t-primary/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                                <PackageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <CardDescription>
                                <span className="text-2xl font-bold text-foreground">${Number(pkg.monthlyPrice).toFixed(2)}</span> / month
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">User Limit</span>
                                    <span className="font-medium">{pkg.userLimit} Users</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Tenant Limit</span>
                                    <span className="font-medium">{pkg.companyLimit} Organizations</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Active Accounts</span>
                                    <Badge variant="secondary">{pkg._count.accounts}</Badge>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Included Modules</p>
                                <div className="flex flex-wrap gap-1">
                                    {pkg.allowedModules.length > 0 ? (
                                        pkg.allowedModules.map((mod) => (
                                            <Badge key={mod} variant="outline" className="text-xs">
                                                {mod}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No specific modules</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {packages.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/5">
                        <PackageIcon className="h-12 w-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">No Packages Found</h3>
                        <p className="text-sm">Create your first subscription package to get started.</p>
                     </div>
                )}
            </div>
        </div>
    );
}
