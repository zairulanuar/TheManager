import React from "react";
import Image from "next/image";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentGatewayLogoProps {
  name: string;
  className?: string;
  isEnabled?: boolean;
}

export function PaymentGatewayLogo({ name, className, isEnabled = true }: PaymentGatewayLogoProps) {
  const lowerName = name.toLowerCase();
  const baseClasses = cn(
    "relative h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden transition-all bg-white border border-gray-100",
    !isEnabled && "grayscale opacity-70",
    className
  );

  if (lowerName.includes("stripe")) {
    return (
      <div className={baseClasses}>
        <Image 
          src="/images/Stripe_icon_-_square.svg" 
          alt="Stripe" 
          fill 
          className="object-contain p-1"
        />
      </div>
    );
  }

  if (lowerName.includes("billplz")) {
    return (
      <div className={baseClasses}>
        <Image 
          src="/images/Billplz - logo - black.svg" 
          alt="Billplz" 
          fill 
          className="object-contain p-1"
        />
      </div>
    );
  }

  if (lowerName.includes("toyyibpay")) {
    return (
      <div className={baseClasses}>
        <Image 
          src="/images/toyyib-pay-logo.svg" 
          alt="ToyyibPay" 
          fill 
          className="object-contain p-1"
        />
      </div>
    );
  }

  if (lowerName.includes("touch") || lowerName.includes("tng")) {
    return (
      <div className={baseClasses}>
        <Image 
          src="/images/logo-tngewallet.svg" 
          alt="Touch 'n Go" 
          fill 
          className="object-contain p-1"
        />
      </div>
    );
  }

  // Default
  return (
    <div className={cn(
      "h-10 w-10 rounded-lg flex items-center justify-center",
      isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      className
    )}>
      <CreditCard className="h-5 w-5" />
    </div>
  );
}
