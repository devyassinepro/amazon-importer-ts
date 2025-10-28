/**
 * GDPR Compliance Webhooks Handler
 * Handles all three mandatory GDPR webhooks through a single endpoint
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// Handle GET requests (for verification)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return new Response(JSON.stringify({
    webhook: "GDPR compliance endpoint",
    status: "ready",
    supported_topics: [
      "customers/data_request",
      "customers/redact",
      "shop/redact"
    ],
    message: "This endpoint accepts POST requests from Shopify with valid HMAC signatures",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  console.log(`📋 Received ${topic} webhook for ${shop}`);

  try {
    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST":
      case "customers/data_request":
        return handleCustomerDataRequest(shop, payload);

      case "CUSTOMERS_REDACT":
      case "customers/redact":
        return handleCustomerRedact(shop, payload);

      case "SHOP_REDACT":
      case "shop/redact":
        return handleShopRedact(shop, payload);

      default:
        console.warn(`Unknown GDPR webhook topic: ${topic}`);
        return new Response(JSON.stringify({
          error: "Unknown topic",
          topic
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    console.error(`❌ Error processing GDPR webhook ${topic} for ${shop}:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

/**
 * Handle customers/data_request webhook
 */
async function handleCustomerDataRequest(shop: string, payload: any) {
  const customerId = payload.customer?.id;
  const shopDomain = payload.shop_domain;

  console.log(`Customer ID: ${customerId}`);
  console.log(`Shop Domain: ${shopDomain}`);
  console.log(`✅ Customer data request processed for ${shop}`);
  console.log(`Note: Amazon Importer does not store customer personal data`);

  return new Response(JSON.stringify({
    message: "Amazon Importer does not store customer personal data",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Handle customers/redact webhook
 */
async function handleCustomerRedact(shop: string, payload: any) {
  const customerId = payload.customer?.id;
  const shopDomain = payload.shop_domain;
  const ordersToRedact = payload.orders_to_redact || [];

  console.log(`Customer ID to redact: ${customerId}`);
  console.log(`Shop Domain: ${shopDomain}`);
  console.log(`Orders to redact: ${ordersToRedact.length}`);
  console.log(`✅ Customer redact request processed for ${shop}`);
  console.log(`Note: Amazon Importer does not store customer personal data`);

  return new Response(JSON.stringify({
    message: "Customer data redacted (no customer data stored)",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Handle shop/redact webhook
 * Called 48 hours after shop uninstalls the app
 */
async function handleShopRedact(shop: string, payload: any) {
  const shopDomain = payload.shop_domain || shop;
  const shopId = payload.shop_id;

  console.log(`Shop Domain to redact: ${shopDomain}`);
  console.log(`Shop ID: ${shopId}`);

  // Delete ALL shop data (final cleanup after 48h grace period)

  // 1. Delete imported products
  const deletedProducts = await prisma.importedProduct.deleteMany({
    where: { shop: shopDomain }
  });
  console.log(`Deleted ${deletedProducts.count} imported products`);

  // 2. Delete app settings
  const deletedSettings = await prisma.appSettings.deleteMany({
    where: { shop: shopDomain }
  });
  console.log(`Deleted app settings`);

  // 3. Delete any remaining sessions
  const deletedSessions = await prisma.session.deleteMany({
    where: { shop: shopDomain }
  });
  console.log(`Deleted ${deletedSessions.count} sessions`);

  console.log(`✅ Successfully redacted all data for shop: ${shopDomain}`);

  return new Response(JSON.stringify({
    message: "Shop data successfully redacted",
    shop: shopDomain,
    timestamp: new Date().toISOString(),
    deletedProducts: deletedProducts.count,
    deletedSessions: deletedSessions.count
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
