"use server";

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import crypto from "crypto";

const prisma = new PrismaClient();

type PaymentResult = 
  | { success: true; paymentUrl: string }
  | { success: false; error: string };

export async function createTestPayment(gatewayId: string, amount: number, customKey?: string): Promise<PaymentResult> {
  try {
    const gateway = await prisma.paymentGateway.findUnique({
      where: { id: gatewayId },
    });

    if (!gateway || !gateway.isEnabled) {
      return { success: false, error: "Gateway not found or disabled" };
    }

    const config = typeof gateway.config === 'string' 
      ? JSON.parse(gateway.config) 
      : gateway.config as any;

    if (gateway.name.toLowerCase().includes("toyyibpay")) {
      if (customKey) config.userSecretKey = customKey;
      return await createToyyibPayBill(config, amount);
    } else if (gateway.name.toLowerCase().includes("stripe")) {
      if (customKey) config.secretKey = customKey;
      return await createStripeSession(config, amount);
    } else if (gateway.name.toLowerCase().includes("billplz")) {
      if (customKey) config.apiKey = customKey;
      return await createBillplzBill(config, amount);
    } else if (gateway.name.toLowerCase().includes("touch") || gateway.name.toLowerCase().includes("tng")) {
      if (customKey) config.privateKey = customKey;
      return await createTngDigitalPayment(config, amount);
    }
    
    // Add other providers here
    
    return { success: false, error: "Provider not supported for sandbox testing yet" };

  } catch (error: any) {
    console.error("Payment Error:", error);
    return { success: false, error: error.message || "Failed to create payment" };
  }
}

async function createToyyibPayBill(config: any, amount: number): Promise<PaymentResult> {
  const isSandbox = config.isSandbox;
  const baseUrl = isSandbox 
    ? "https://dev.toyyibpay.com" 
    : "https://toyyibpay.com";
    
  const formData = new URLSearchParams();
  formData.append('userSecretKey', config.userSecretKey);
  formData.append('categoryCode', config.categoryCode);
  formData.append('billName', 'Sandbox Test Payment');
  formData.append('billDescription', 'Test payment from system sandbox');
  formData.append('billPriceSetting', '1');
  formData.append('billPayorInfo', '1');
  formData.append('billAmount', (amount * 100).toString()); // Amount in cents
  formData.append('billReturnUrl', 'http://localhost:3000/system/payment-gateways/sandbox');
  formData.append('billCallbackUrl', 'http://localhost:3000/api/payment/callback');
  formData.append('billExternalReferenceNo', `TEST-${Date.now()}`);
  formData.append('billTo', 'Test User');
  formData.append('billEmail', 'test@example.com');
  formData.append('billPhone', '0123456789');

  try {
    const response = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();
    
    // ToyyibPay returns generic object, check for BillCode
    if (data && data[0] && data[0].BillCode) {
        return { 
            success: true, 
            paymentUrl: `${baseUrl}/${data[0].BillCode}` 
        };
    } else {
        // Handle error response which might be in different format
        return { 
            success: false,
            error: JSON.stringify(data) || "Failed to create bill with ToyyibPay" 
        };
    }

  } catch (error: any) {
    return { success: false, error: "ToyyibPay API connection failed: " + error.message };
  }
}

async function createBillplzBill(config: any, amount: number): Promise<PaymentResult> {
  const isSandbox = config.isSandbox;
  const baseUrl = isSandbox
    ? "https://www.billplz-sandbox.com/api/v3"
    : "https://www.billplz.com/api/v3";

  if (!config.apiKey || !config.collectionId) {
    return { success: false, error: "Billplz API Key or Collection ID is missing" };
  }

  // Billplz uses Basic Auth with API Key as username
  const auth = Buffer.from(`${config.apiKey}:`).toString('base64');

  const payload = {
    collection_id: config.collectionId,
    description: "Sandbox Test Payment",
    email: "test@example.com",
    name: "Test User",
    amount: Math.round(amount * 100), // Amount in cents
    callback_url: "http://localhost:3000/api/payment/billplz/callback",
    redirect_url: "http://localhost:3000/system/payment-gateways/sandbox?billplz[paid]=true"
  };

  try {
    const response = await fetch(`${baseUrl}/bills`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.url) {
      return { success: true, paymentUrl: data.url };
    } else {
      console.error("Billplz Error:", data);
      const errorMessage = data.error?.message || JSON.stringify(data);
      return { success: false, error: `Billplz creation failed: ${errorMessage}` };
    }

  } catch (error: any) {
    console.error("Billplz Connection Error:", error);
    return { success: false, error: "Billplz connection failed: " + error.message };
  }
}

async function createTngDigitalPayment(config: any, amount: number): Promise<PaymentResult> {
  const isSandbox = config.isSandbox;
  // Note: Host might need to be adjusted based on actual TNG environment
  const host = isSandbox 
    ? "https://ual.tngdigital.com.my" // Common staging host, may vary
    : "https://miniprogram.tngdigital.com.my"; 
    
  const path = "/acl/api/v1/payments/pay";
  const url = `${host}${path}`;

  if (!config.clientId || !config.privateKey || !config.merchantId) {
    return { success: false, error: "TNG Digital Client ID, Merchant ID, or Private Key is missing" };
  }

  const paymentRequestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const requestTime = new Date().toISOString();

  // Payload structure based on TNG Digital Mini Program API
  const payload = {
    partnerId: config.merchantId,
    appId: "unknown", // This might need to be configurable if strictly required
    paymentRequestId: paymentRequestId,
    paymentOrderTitle: "Sandbox Test Payment",
    productCode: "PC_000001", // Example product code
    mcc: "0000",
    paymentAmount: {
      currency: "MYR",
      value: Math.round(amount * 100).toString() // Cents
    },
    paymentFactor: {
      isCashierPayment: true
    },
    paymentReturnUrl: "http://localhost:3000/system/payment-gateways/sandbox?status=success",
    paymentNotifyUrl: "http://localhost:3000/api/payment/tng/callback",
    extendInfo: JSON.stringify({ customerBelongsTo: "tng" }),
    envInfo: {
        osType: "IOS",
        terminalType: "APP"
    }
  };

  try {
    const bodyString = JSON.stringify(payload);
    
    // Signature Generation (RSA-SHA256)
    // NOTE: The exact signature content rule (what to sign) is not fully clear from public docs snippet.
    // Common pattern for such APIs is signing the Request Body.
    // If this fails, the signing string construction needs to be verified against full docs.
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(bodyString);
    signer.end();
    const signature = signer.sign(config.privateKey, 'base64');

    // Construct Signature Header
    const signatureHeader = `algorithm=RSA256, keyVersion=1, signature=${signature}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Client-Id': config.clientId,
        'Request-Time': requestTime,
        'Signature': signatureHeader,
      },
      body: bodyString,
    });

    const data = await response.json();

    // Check for success (TNG usually returns result.resultStatus == 'A' or 'S')
    if (data.result && (data.result.resultStatus === 'A' || data.result.resultStatus === 'S')) {
       // For Cashier Payment, they return actionForm with redirectionUrl
       if (data.actionForm && data.actionForm.redirectionUrl) {
           return { success: true, paymentUrl: data.actionForm.redirectionUrl };
       }
       return { success: true, paymentUrl: "#" }; // Fallback if no URL
    } else {
       console.error("TNG Error:", data);
       const errorMsg = data.result?.resultMessage || JSON.stringify(data);
       return { success: false, error: `TNG Digital creation failed: ${errorMsg}` };
    }

  } catch (error: any) {
    console.error("TNG Connection Error:", error);
    return { success: false, error: "TNG Digital connection failed: " + error.message };
  }
}

async function createStripeSession(config: any, amount: number): Promise<PaymentResult> {
  try {
    if (!config.secretKey) {
      return { success: false, error: "Stripe Secret Key is missing" };
    }

    const stripe = new Stripe(config.secretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: 'Sandbox Test Payment',
              description: 'Test payment from system sandbox',
            },
            unit_amount: Math.round(amount * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/system/payment-gateways/sandbox?status=success',
      cancel_url: 'http://localhost:3000/system/payment-gateways/sandbox?status=cancelled',
    });

    if (session.url) {
      return { success: true, paymentUrl: session.url };
    } else {
      return { success: false, error: "Failed to generate Stripe session URL" };
    }
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return { success: false, error: "Stripe connection failed: " + error.message };
  }
}
