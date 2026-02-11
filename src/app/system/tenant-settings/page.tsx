import { getTenantData } from "./actions";
import { TenantSettingsForm } from "./tenant-settings-form";
import { Building2 } from "lucide-react";
import { getSessionContext } from "@/core/services/auth-service";
import { db } from "@/lib/db";

export default async function TenantSettingsPage() {
    const session = await getSessionContext();
    const isAuthorized = session && (
        ['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(session.role?.type || '') ||
        // @ts-ignore
        ['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(session.roleType || '') ||
        // @ts-ignore
        session.role === 'SUPER_ADMIN'
    );

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <Building2 className="w-12 h-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                    <p className="text-muted-foreground max-w-[500px]">
                        Tenant settings are restricted to Administrators.
                    </p>
                </div>
            </div>
        );
    }

    const data = await getTenantData();

    if ('error' in data) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <Building2 className="h-12 w-12 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p>You must be logged in to view these settings.</p>
            </div>
        );
    }

    const availableCurrencies = await db.currency.findMany({
        orderBy: { code: 'asc' }
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tenant Settings</h2>
                <p className="text-muted-foreground">Manage your company profile and preferences.</p>
            </div>
            
            <TenantSettingsForm 
                organizations={data.organizations as any} 
                availableCurrencies={availableCurrencies} 
            />
        </div>
    );
}
