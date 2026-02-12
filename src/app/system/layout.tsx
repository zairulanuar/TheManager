import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Sidebar from "@/core/components/Sidebar";
import Header from "@/core/components/Header";
import { getPublishedThemes } from "./tenant-settings/appearance/actions";
import { DynamicThemeProvider } from "@/core/providers/dynamic-theme-provider";

export default async function SystemLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;

  if (!userId) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { 
      account: true,
      role: true
    }
  });

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user permissions
  const permissions = user.roleId ? await db.rolePermission.findMany({
    where: { roleId: user.roleId }
  }) : [];

  const themes = await getPublishedThemes();

  return (
    <DynamicThemeProvider themes={themes}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* <Sidebar user={user} permissions={permissions} /> */}
        <div className="flex flex-col flex-1 overflow-hidden">
           <Header user={user} permissions={permissions} />
           <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/10 p-6 md:p-8">
              <div className="mx-auto max-w-7xl space-y-8">
                  {children}
              </div>
           </main>
        </div>
      </div>
    </DynamicThemeProvider>
  );
}
