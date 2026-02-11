"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { upsertPaymentGateway } from "./actions";
import { Loader2 } from "lucide-react";
import { PaymentGatewayLogo } from "./payment-gateway-logo";

interface PaymentGateway {
  id: string;
  name: string;
  isEnabled: boolean;
  config: any;
  isDefault: boolean;
}

interface PaymentGatewayDialogProps {
  gateway?: PaymentGateway | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  organizationId?: string;
}

type ProviderType = "custom" | "toyyibpay" | "stripe" | "billplz" | "tng";

export function PaymentGatewayDialog({
  gateway,
  open,
  onOpenChange,
  trigger,
  organizationId,
}: PaymentGatewayDialogProps) {
  const [loading, setLoading] = useState(false);
  const [providerType, setProviderType] = useState<ProviderType>("custom");
  const [formData, setFormData] = useState({
    name: "",
    config: "{}",
    isEnabled: false,
    isDefault: false,
  });

  // ToyyibPay specific state
  const [toyyibPayConfig, setToyyibPayConfig] = useState({
    userSecretKey: "",
    categoryCode: "",
    billName: "Payment",
    billDescription: "Payment Description",
    isSandbox: false,
  });

  // Stripe specific state
  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: "",
    secretKey: "",
  });

  // Billplz specific state
  const [billplzConfig, setBillplzConfig] = useState({
    apiKey: "",
    collectionId: "",
    xSignatureKey: "",
    isSandbox: false,
  });

  // TNG Digital specific state
  const [tngConfig, setTngConfig] = useState({
    clientId: "",
    merchantId: "",
    privateKey: "",
    isSandbox: false,
  });

  useEffect(() => {
    if (gateway) {
      setFormData({
        name: gateway.name,
        config: JSON.stringify(gateway.config, null, 2),
        isEnabled: gateway.isEnabled,
        isDefault: gateway.isDefault,
      });

      // Try to detect provider type from name or config structure
      const nameLower = gateway.name.toLowerCase();
      if (nameLower.includes("toyyibpay")) {
        setProviderType("toyyibpay");
        setToyyibPayConfig({
          userSecretKey: gateway.config.userSecretKey || "",
          categoryCode: gateway.config.categoryCode || "",
          billName: gateway.config.billName || "Payment",
          billDescription: gateway.config.billDescription || "Payment Description",
          isSandbox: gateway.config.isSandbox || false,
        });
      } else if (nameLower.includes("stripe")) {
        setProviderType("stripe");
        setStripeConfig({
          publishableKey: gateway.config.publishableKey || "",
          secretKey: gateway.config.secretKey || "",
        });
      } else if (nameLower.includes("billplz")) {
        setProviderType("billplz");
        setBillplzConfig({
          apiKey: gateway.config.apiKey || "",
          collectionId: gateway.config.collectionId || "",
          xSignatureKey: gateway.config.xSignatureKey || "",
          isSandbox: gateway.config.isSandbox || false,
        });
      } else if (nameLower.includes("touch") || nameLower.includes("tng")) {
        setProviderType("tng");
        setTngConfig({
          clientId: gateway.config.clientId || "",
          merchantId: gateway.config.merchantId || "",
          privateKey: gateway.config.privateKey || "",
          isSandbox: gateway.config.isSandbox || false,
        });
      } else {
        setProviderType("custom");
      }
    } else {
      setFormData({
        name: "",
        config: "{\n  \"apiKey\": \"\",\n  \"secretKey\": \"\"\n}",
        isEnabled: false,
        isDefault: false,
      });
      setProviderType("custom");
      setToyyibPayConfig({
        userSecretKey: "",
        categoryCode: "",
        billName: "Payment",
        billDescription: "Payment Description",
        isSandbox: false,
      });
      setStripeConfig({
        publishableKey: "",
        secretKey: "",
      });
      setBillplzConfig({
        apiKey: "",
        collectionId: "",
        xSignatureKey: "",
        isSandbox: false,
      });
      setTngConfig({
        clientId: "",
        merchantId: "",
        privateKey: "",
        isSandbox: false,
      });
    }
  }, [gateway, open]);

  // Update config string when specific provider fields change
  useEffect(() => {
    if (providerType === "toyyibpay") {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || "ToyyibPay",
        config: JSON.stringify(toyyibPayConfig, null, 2),
      }));
    } else if (providerType === "stripe") {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || "Stripe",
        config: JSON.stringify(stripeConfig, null, 2),
      }));
    } else if (providerType === "billplz") {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || "Billplz",
        config: JSON.stringify(billplzConfig, null, 2),
      }));
    } else if (providerType === "tng") {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || "Touch 'n Go",
        config: JSON.stringify(tngConfig, null, 2),
      }));
    }
  }, [toyyibPayConfig, stripeConfig, billplzConfig, tngConfig, providerType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate JSON
      try {
        JSON.parse(formData.config);
      } catch (e) {
        toast.error("Invalid JSON configuration");
        setLoading(false);
        return;
      }

      const result = await upsertPaymentGateway({
        id: gateway?.id,
        ...formData,
        organizationId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          gateway
            ? "Payment gateway updated successfully"
            : "Payment gateway created successfully"
        );
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {gateway ? "Edit Payment Gateway" : "Add Payment Gateway"}
          </DialogTitle>
          <DialogDescription>
            Configure the payment gateway settings here. API keys are stored securely.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="providerType">Provider Template</Label>
            <Select
              value={providerType}
              onValueChange={(value: ProviderType) => {
                setProviderType(value);
                if (value === "toyyibpay" && !formData.name) {
                  setFormData(prev => ({ ...prev, name: "ToyyibPay" }));
                } else if (value === "stripe" && !formData.name) {
                  setFormData(prev => ({ ...prev, name: "Stripe" }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <PaymentGatewayLogo name="custom" className="h-5 w-5 rounded-sm" />
                    Custom (JSON)
                  </div>
                </SelectItem>
                <SelectItem value="toyyibpay">
                  <div className="flex items-center gap-2">
                    <PaymentGatewayLogo name="toyyibpay" className="h-5 w-5 rounded-sm" />
                    ToyyibPay
                  </div>
                </SelectItem>
                <SelectItem value="stripe">
                  <div className="flex items-center gap-2">
                    <PaymentGatewayLogo name="stripe" className="h-5 w-5 rounded-sm" />
                    Stripe
                  </div>
                </SelectItem>
                <SelectItem value="billplz">
                  <div className="flex items-center gap-2">
                    <PaymentGatewayLogo name="billplz" className="h-5 w-5 rounded-sm" />
                    Billplz
                  </div>
                </SelectItem>
                <SelectItem value="tng">
                  <div className="flex items-center gap-2">
                    <PaymentGatewayLogo name="tng" className="h-5 w-5 rounded-sm" />
                    Touch 'n Go Digital
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Stripe"
              required
            />
          </div>

          {providerType === "toyyibpay" && (
            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
              <div className="grid gap-2">
                <Label htmlFor="userSecretKey">User Secret Key</Label>
                <Input
                  id="userSecretKey"
                  value={toyyibPayConfig.userSecretKey}
                  onChange={(e) =>
                    setToyyibPayConfig({ ...toyyibPayConfig, userSecretKey: e.target.value })
                  }
                  placeholder="e.g. j2d2v697-..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryCode">Category Code</Label>
                <Input
                  id="categoryCode"
                  value={toyyibPayConfig.categoryCode}
                  onChange={(e) =>
                    setToyyibPayConfig({ ...toyyibPayConfig, categoryCode: e.target.value })
                  }
                  placeholder="e.g. gcbhict9"
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="toyyibPaySandbox" className="flex flex-col space-y-1">
                  <span>Sandbox Mode</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Use dev.toyyibpay.com for testing
                  </span>
                </Label>
                <Switch
                  id="toyyibPaySandbox"
                  checked={toyyibPayConfig.isSandbox}
                  onCheckedChange={(checked) =>
                    setToyyibPayConfig({ ...toyyibPayConfig, isSandbox: checked })
                  }
                />
              </div>
            </div>
          )}

          {providerType === "stripe" && (
            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
              <div className="grid gap-2">
                <Label htmlFor="publishableKey">Publishable Key</Label>
                <Input
                  id="publishableKey"
                  value={stripeConfig.publishableKey}
                  onChange={(e) =>
                    setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })
                  }
                  placeholder="pk_test_..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={stripeConfig.secretKey}
                  onChange={(e) =>
                    setStripeConfig({ ...stripeConfig, secretKey: e.target.value })
                  }
                  placeholder="sk_test_..."
                />
              </div>
            </div>
          )}

          {providerType === "billplz" && (
            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Secret Key</Label>
                <Input
                  id="apiKey"
                  value={billplzConfig.apiKey}
                  onChange={(e) =>
                    setBillplzConfig({ ...billplzConfig, apiKey: e.target.value })
                  }
                  placeholder="e.g. 73eb57f0-..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="collectionId">Collection ID</Label>
                <Input
                  id="collectionId"
                  value={billplzConfig.collectionId}
                  onChange={(e) =>
                    setBillplzConfig({ ...billplzConfig, collectionId: e.target.value })
                  }
                  placeholder="e.g. inbmmepb"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="xSignatureKey">X Signature Key</Label>
                <Input
                  id="xSignatureKey"
                  value={billplzConfig.xSignatureKey}
                  onChange={(e) =>
                    setBillplzConfig({ ...billplzConfig, xSignatureKey: e.target.value })
                  }
                  placeholder="Optional, for verifying callbacks"
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="billplzSandbox" className="flex flex-col space-y-1">
                  <span>Sandbox Mode</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Use billplz-sandbox.com for testing
                  </span>
                </Label>
                <Switch
                  id="billplzSandbox"
                  checked={billplzConfig.isSandbox}
                  onCheckedChange={(checked) =>
                    setBillplzConfig({ ...billplzConfig, isSandbox: checked })
                  }
                />
              </div>
            </div>
          )}

          {providerType === "tng" && (
            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
              <div className="grid gap-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={tngConfig.clientId}
                  onChange={(e) =>
                    setTngConfig({ ...tngConfig, clientId: e.target.value })
                  }
                  placeholder="e.g. tngd_..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="merchantId">Merchant ID (Partner ID)</Label>
                <Input
                  id="merchantId"
                  value={tngConfig.merchantId}
                  onChange={(e) =>
                    setTngConfig({ ...tngConfig, merchantId: e.target.value })
                  }
                  placeholder="e.g. 20000..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="privateKey">Private Key (RSA256)</Label>
                <Input
                  id="privateKey"
                  type="password"
                  value={tngConfig.privateKey}
                  onChange={(e) =>
                    setTngConfig({ ...tngConfig, privateKey: e.target.value })
                  }
                  placeholder="-----BEGIN PRIVATE KEY-----..."
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="tngSandbox" className="flex flex-col space-y-1">
                  <span>Sandbox Mode</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Use sandbox API endpoints
                  </span>
                </Label>
                <Switch
                  id="tngSandbox"
                  checked={tngConfig.isSandbox}
                  onCheckedChange={(checked) =>
                    setTngConfig({ ...tngConfig, isSandbox: checked })
                  }
                />
              </div>
            </div>
          )}

          {providerType === "custom" && (
            <div className="grid gap-2">
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={(e) =>
                  setFormData({ ...formData, config: e.target.value })
                }
                className="font-mono text-sm h-[150px]"
                placeholder="{ ... }"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isEnabled" className="flex flex-col space-y-1">
              <span>Enabled</span>
              <span className="font-normal text-xs text-muted-foreground">
                Activate this gateway for transactions
              </span>
            </Label>
            <Switch
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isEnabled: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isDefault" className="flex flex-col space-y-1">
              <span>Default Gateway</span>
              <span className="font-normal text-xs text-muted-foreground">
                Use this as the primary payment method
              </span>
            </Label>
            <Switch
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked })
              }
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {gateway ? "Save Changes" : "Create Gateway"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
