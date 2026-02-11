import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, CreditCard, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

async function getBillingData() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_user_id")?.value;
  if (!userId) return null;

  return db.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      account: {
        include: {
          package: true,
          organizations: true,
          users: true
        }
      }
    }
  });
}

export default async function BillingsPage() {
  const user = await getBillingData();

  // Check Super Admin via Role Type (Support both old Enum and new Model)
  const isSuperAdmin = user && (
    user.role?.type === 'SUPER_ADMIN' || 
    // @ts-ignore
    user.roleType === 'SUPER_ADMIN' || 
    // @ts-ignore
    user.role === 'SUPER_ADMIN'
  );

  if (!isSuperAdmin) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="p-4 bg-destructive/10 rounded-full">
                <CreditCard className="w-12 h-12 text-destructive" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                <p className="text-muted-foreground max-w-[500px]">
                    Billing settings are restricted to Super Administrators only.
                </p>
            </div>
        </div>
    );
  }

  if (!user || !user.account) {
    redirect("/auth/login");
  }

  const currentPackage = user.account.package;
  const account = user.account;
  
  // Determine limits (use account limits if set, otherwise package limits, otherwise defaults)
  const userLimit = account.userLimit || currentPackage?.userLimit || 5;
  const companyLimit = account.companyLimit || currentPackage?.companyLimit || 1;
  
  const currentUsersCount = account.users.length;
  const currentOrgsCount = account.organizations.length;
  
  const userUsagePercent = Math.min((currentUsersCount / userLimit) * 100, 100);
  const orgUsagePercent = Math.min((currentOrgsCount / companyLimit) * 100, 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">Manage your subscription package and billing details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Current Plan
            </CardTitle>
            <CardDescription>Your current subscription package</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPackage ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-bold text-primary">{currentPackage.name}</h3>
                  <div className="text-right">
                    <span className="text-xl font-bold">
                      ${Number(currentPackage.monthlyPrice).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Badge variant="outline">Auto-renew</Badge>
                </div>

                <Separator />
                
                <div>
                    <p className="text-sm font-medium mb-2">Included Features:</p>
                    <ul className="space-y-2">
                        {currentPackage.allowedModules.map((module) => (
                            <li key={module} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-500 shrink-0" />
                                <span className="capitalize">{module.replace('-', ' ')}</span>
                            </li>
                        ))}
                        {currentPackage.allowedModules.length === 0 && (
                             <li className="text-sm text-muted-foreground italic">No specific modules listed</li>
                        )}
                    </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                    <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="font-medium text-lg">No Active Package</h3>
                    <p className="text-sm text-muted-foreground">You are on the free tier.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full">
                {currentPackage ? "Upgrade Plan" : "Select a Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Usage & Limits Card */}
        <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Account Usage
                </CardTitle>
                <CardDescription>Current resource usage vs plan limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Organizations</span>
                            <span className="text-sm text-muted-foreground">{currentOrgsCount} / {companyLimit}</span>
                        </div>
                        <Progress value={orgUsagePercent} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            Number of active tenants in your account.
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Users</span>
                            <span className="text-sm text-muted-foreground">{currentUsersCount} / {userLimit}</span>
                        </div>
                        <Progress value={userUsagePercent} className="h-2" />
                         <p className="text-xs text-muted-foreground">
                            Total users across all your organizations.
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Billing Information</h4>
                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                        <div className="grid gap-1">
                            <span className="text-muted-foreground">Account Name</span>
                            <span className="font-medium">{account.name}</span>
                        </div>
                         <div className="grid gap-1">
                            <span className="text-muted-foreground">Account ID</span>
                            <span className="font-mono text-xs">{account.id}</span>
                        </div>
                        <div className="grid gap-1">
                            <span className="text-muted-foreground">Next Billing Date</span>
                            <span className="font-medium">--</span>
                        </div>
                        <div className="grid gap-1">
                            <span className="text-muted-foreground">Payment Method</span>
                            <span className="font-medium">--</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
