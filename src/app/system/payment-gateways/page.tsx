import { getPaymentGateways } from "./actions";
import PaymentGatewayList from "./payment-gateway-list";
import { CreditCard } from "lucide-react";
import { getSessionContext } from "@/core/services/auth-service";

export const metadata = {
  title: "Payment Gateways | System Settings",
  description: "Manage payment gateways and configurations.",
};

export default async function PaymentGatewaysPage() {
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
                  <CreditCard className="w-12 h-12 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">Access Restricted</h1>
                  <p className="text-muted-foreground max-w-[500px]">
                      Global payment gateway management is restricted to Super Administrators only.
                  </p>
              </div>
          </div>
      );
  }

  const rawGateways = await getPaymentGateways();

  // Serialize dates to strings to pass to client component
  const gateways = rawGateways.map((gateway) => ({
    ...gateway,
    createdAt: gateway.createdAt.toISOString(),
    updatedAt: gateway.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Payment Gateways
        </h2>
        <p className="text-muted-foreground">
          Configure payment providers and API keys for the system.
        </p>
      </div>

      <PaymentGatewayList gateways={gateways} />
    </div>
  );
}
