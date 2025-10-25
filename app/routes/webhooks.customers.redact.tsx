/**
 * GDPR Webhook: customers/redact
 * Required for Shopify App Store approval
 *
 * This webhook is triggered when a shop owner requests to redact customer data.
 * You must delete all customer data related to this customer.
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// Handle GET requests (for verification)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return new Response(JSON.stringify({
    webhook: "customers/redact",
    status: "ready",
    message: "This endpoint accepts POST requests from Shopify with valid HMAC signatures",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  console.log(`🔒 Received ${topic} webhook for ${shop}`);
  console.log(`Customer redact payload:`, payload);

  try {
    const customerId = (payload as any).customer?.id;
    const shopDomain = (payload as any).shop_domain;
    const ordersToRedact = (payload as any).orders_to_redact || [];

    console.log(`Customer ID to redact: ${customerId}`);
    console.log(`Shop Domain: ${shopDomain}`);
    console.log(`Orders to redact: ${ordersToRedact.length}`);

    // For Amazon Importer, we don't store customer personal data
    // We only store shop-level data (products, settings)
    // If you stored customer data, you would delete it here

    // Example if you stored customer-related data:
    // await prisma.customerData.deleteMany({
    //   where: {
    //     shop,
    //     customerId: customerId.toString()
    //   }
    // });

    console.log(`✅ Customer redact request processed for ${shop}`);
    console.log(`Note: Amazon Importer does not store customer personal data`);

    return new Response(JSON.stringify({
      message: "Customer data redacted (no customer data stored)",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error(`❌ Error processing customer redact for ${shop}:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
