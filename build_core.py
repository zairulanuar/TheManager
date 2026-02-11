import os

# DEFINITION OF THE ENTIRE UNIFIED SYSTEM
files = {
    # 1. DATABASE SCHEMA (Full Hierarchy: Account -> Organization -> Modules)
    "prisma/schema.prisma": """
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  OWNER
  ADMIN
  USER
}

model Package {
  id           String   @id @default(cuid())
  name         String   @unique
  monthlyPrice Decimal
  userLimit    Int      @default(5)
  companyLimit Int      @default(1)
  allowedModules String[]
  accounts     Account[]
}

model Account {
  id            String         @id @default(cuid())
  name          String
  slug          String         @unique
  packageId     String?
  package       Package?       @relation(fields: [packageId], references: [id])
  organizations Organization[]
  users         User[]
}

model Organization {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  currency      String   @default("USD")
  currencySymbol String  @default("$")
  accountId     String
  account       Account  @relation(fields: [accountId], references: [id])
  moduleConfigs ModuleConfig[]
}

model User {
  id             String           @id @default(cuid())
  email          String           @unique
  password       String
  role           Role             @default(USER)
  accountId      String?
  account        Account?         @relation(fields: [accountId], references: [id])
  permissions    UserPermission[]
}

model ModuleConfig {
  id             String       @id @default(cuid())
  moduleKey      String       
  isEnabled      Boolean      @default(false)
  metadata       Json?        
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, moduleKey])
}

model UserPermission {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  moduleKey String
  canView   Boolean @default(true)
  canEdit   Boolean @default(false)

  @@unique([userId, moduleKey])
}
""",

    # 2. CORE SERVICES (Auth, Installer, Quota, Currency)
    "src/core/services/auth-service.ts": """
import { db } from "@/lib/db";

export async function canUserAccessModule(userId: string, moduleKey: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: { account: { include: { organizations: { include: { moduleConfigs: true } } } } }
    });
    if (user?.role === 'SUPER_ADMIN') return true;
    return true; // Simplified for initial build
}
""",

    "src/core/services/installer-service.ts": """
import AdmZip from "adm-zip";
import path from "path";
import { db } from "@/lib/db";

export async function installModule(fileBuffer: Buffer, orgId: string) {
    const zip = new AdmZip(fileBuffer);
    const manifest = JSON.parse(zip.getEntry("module.json")!.getData().toString("utf8"));
    zip.extractAllTo(path.join(process.cwd(), "src/modules", manifest.id), true);
    return await db.moduleConfig.upsert({
        where: { organizationId_moduleKey: { organizationId: orgId, moduleKey: manifest.id } },
        update: { isEnabled: true, metadata: manifest.navItems },
        create: { organizationId: orgId, moduleKey: manifest.id, isEnabled: true, metadata: manifest.navItems }
    });
}
""",

    "src/core/services/quota-service.ts": """
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
""",

    "src/core/services/currency-service.ts": """
export const CurrencyService = {
  format: (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }
};
""",

    # 3. CORE UI & THEME COMPONENTS
    "src/core/providers/theme-provider.tsx": """
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
export function ThemeProvider({ children, ...props }: any) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
""",

    "src/core/components/ui/DynamicIcon.tsx": """
import React from 'react';
import * as LucideIcons from 'lucide-react';

export const DynamicIcon = ({ name, className, size = 20 }: any) => {
    if (name?.startsWith('fa')) return <i className={`${name} ${className}`} style={{ fontSize: size }} />;
    const Icon = (LucideIcons as any)[name];
    return Icon ? <Icon className={className} size={size} /> : <LucideIcons.HelpCircle size={size} />;
};
""",

    "src/core/components/Sidebar.tsx": """
"use client";
import React, { useState } from 'react';
import { DynamicIcon } from './ui/DynamicIcon';
import CompanySwitcher from './CompanySwitcher';

export default function Sidebar({ user, companies, currentOrg, activeModules }: any) {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white h-screen transition-all flex flex-col`}>
            <div className="p-4 border-b border-slate-800 font-bold">THE MANAGER</div>
            {!collapsed && <CompanySwitcher companies={companies} currentOrg={currentOrg} />}
            <nav className="flex-1 p-4 space-y-2">
                {activeModules?.map((mod: any) => (
                    <div key={mod.id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer">
                        <DynamicIcon name={mod.icon || 'Package'} /> {!collapsed && mod.moduleKey}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
""",

    "src/core/components/CompanySwitcher.tsx": """
"use client";
export default function CompanySwitcher({ companies, currentOrg }: any) {
  return (
    <div className="p-4">
      <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs">
        {companies?.map((c: any) => (
          <option key={c.id} selected={c.id === currentOrg?.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
""",

    # 4. SYSTEM LAYOUT & CONFIG
    "src/app/layout.tsx": """
import { ThemeProvider } from "@/core/providers/theme-provider";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
""",

    "src/app/globals.css": """
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { --background: 0 0% 100%; --foreground: 222.2 84% 4.9%; }
  .dark { --background: 222.2 84% 4.9%; --foreground: 210 40% 98%; }
}
body { background: hsl(var(--background)); color: hsl(var(--foreground)); }
""",

    "package.json": """
{
  "name": "the-manager-saas",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest",
    "next-themes": "latest",
    "@prisma/client": "latest",
    "adm-zip": "^0.5.10",
    "bcryptjs": "^2.4.3",
    "clsx": "latest",
    "tailwind-merge": "latest"
  },
  "devDependencies": {
    "prisma": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "@types/node": "latest",
    "@types/react": "latest"
  }
}
""",
    ".env": "DATABASE_URL=\"postgresql://postgres:password@localhost:5432/themanager?schema=public\"",
    "capacitor.config.ts": """
import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.laragon.themanager',
  appName: 'TheManager',
  webDir: 'out',
  bundledWebRuntime: false
};
export default config;
"""
}

def build():
    print("🏗️  GENERATING FINAL UNIFIED CORE...")
    for path, content in files.items():
        dir_name = os.path.dirname(path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content.strip())
        print(f"✅ Created: {path}")
    print("\\n🚀 FULL SYSTEM READY.")

if __name__ == "__main__":
    build()