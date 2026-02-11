"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ExternalLink, TestTube } from "lucide-react";
import { getPaymentGateways } from "../actions";
import { createTestPayment } from "./actions";
import { PaymentGatewayLogo } from "../payment-gateway-logo";

interface Gateway {
  id: string;
  name: string;
  isEnabled: boolean;
  config: any;
}

export default function PaymentSandboxPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [amount, setAmount] = useState<string>("1.00");
  const [customKey, setCustomKey] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Helper to determine what kind of key is needed
  const getSelectedGatewayType = () => {
    const gateway = gateways.find(g => g.id === selectedGateway);
    if (!gateway) return null;
    if (gateway.name.toLowerCase().includes("stripe")) return "stripe";
    if (gateway.name.toLowerCase().includes("toyyibpay")) return "toyyibpay";
    if (gateway.name.toLowerCase().includes("billplz")) return "billplz";
    if (gateway.name.toLowerCase().includes("touch") || gateway.name.toLowerCase().includes("tng")) return "tng";
    return null;
  };

  const gatewayType = getSelectedGatewayType();

  useEffect(() => {
    const status = searchParams.get("status");
    const billplzPaid = searchParams.get("billplz[paid]");
    
    if (status === "success" || billplzPaid === "true") {
      toast.success("Payment successful! (Sandbox)");
      router.replace("/system/payment-gateways/sandbox");
    } else if (status === "cancelled") {
      toast.error("Payment cancelled. (Sandbox)");
      router.replace("/system/payment-gateways/sandbox");
    }
    
    loadGateways();
  }, [searchParams, router]);

  async function loadGateways() {
    try {
      const data = await getPaymentGateways();
      setGateways(data.filter((g: any) => g.isEnabled));
    } catch (error) {
      toast.error("Failed to load payment gateways");
    }
  }

  async function handleTestPayment() {
    if (!selectedGateway) {
      toast.error("Please select a payment gateway");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const result = await createTestPayment(selectedGateway, numAmount, customKey);
      
      if (!result.success) {
        toast.error(result.error);
      } else if (result.paymentUrl) {
        toast.success("Payment session created! Redirecting...");
        window.open(result.paymentUrl, "_blank");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TestTube className="h-8 w-8 text-primary" />
          Payment Sandbox
        </h2>
        <p className="text-muted-foreground">
          Test your payment gateway configurations by creating dummy transactions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Transaction</CardTitle>
          <CardDescription>
            Create a test payment to verify gateway connectivity and configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Select Gateway</Label>
            <Select
              value={selectedGateway}
              onValueChange={setSelectedGateway}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a gateway to test" />
              </SelectTrigger>
              <SelectContent>
                {gateways.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No enabled gateways found
                  </SelectItem>
                ) : (
                  gateways.map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.id}>
                      <div className="flex items-center gap-2">
                        <PaymentGatewayLogo name={gateway.name} className="h-6 w-6 rounded-md" />
                        {gateway.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Amount (RM)</Label>
            <Input
              type="number"
              min="1.00"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.00"
            />
            <p className="text-xs text-muted-foreground">
              Minimum amount is usually RM 1.00 for most gateways.
            </p>
          </div>

          {gatewayType && (
            <div className="grid gap-2">
              <Label>
                Test API Key (Optional)
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Overrides the saved configuration
                </span>
              </Label>
              <Input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder={
                  gatewayType === "stripe" 
                    ? "sk_test_..." 
                    : gatewayType === "billplz"
                    ? "API Secret Key (e.g. 73eb...)"
                    : gatewayType === "tng"
                    ? "Private Key (RSA256)"
                    : "User Secret Key (e.g. j2d2...)"
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the saved {
                  gatewayType === "stripe" 
                    ? "Secret Key" 
                    : gatewayType === "billplz"
                    ? "API Key"
                    : gatewayType === "tng"
                    ? "Private Key"
                    : "User Secret Key"
                }.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleTestPayment} 
            disabled={loading || !selectedGateway}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Transaction...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Launch Test Payment
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md text-sm text-blue-800 dark:text-blue-200">
        <h4 className="font-semibold mb-2">Testing Notes:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>For <strong>ToyyibPay</strong>, ensure "Sandbox Mode" is enabled in the gateway configuration if you are using sandbox credentials.</li>
          <li>For <strong>Stripe</strong>, ensure you are using Test Mode keys (sk_test_...).</li>
          <li>For <strong>Billplz</strong>, ensure "Sandbox Mode" is enabled and you use the Sandbox API Key.</li>
          <li>For <strong>Touch 'n Go Digital</strong>, ensure you use the sandbox Client ID and Private Key.</li>
          <li>The payment will open in a new tab.</li>
          <li>This is a simulation and no real money should be deducted if configured correctly for test/sandbox environments.</li>
        </ul>
      </div>
    </div>
  );
}
