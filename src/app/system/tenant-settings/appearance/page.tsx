
import React from "react";
import { getTenantThemes } from "./actions";
import { ThemeManager } from "./theme-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionContext } from "@/core/services/auth-service";
import { Palette } from "lucide-react";

export default async function AppearancePage() {
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
                  <Palette className="w-12 h-12 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                  <p className="text-muted-foreground max-w-[500px]">
                      Appearance settings are restricted to Administrators.
                  </p>
              </div>
          </div>
      );
  }

  const themes = await getTenantThemes();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appearance</h2>
        <p className="text-muted-foreground">
          Manage your tenant's themes and branding.
        </p>
      </div>
      
      <ThemeManager themes={themes} />
    </div>
  );
}
