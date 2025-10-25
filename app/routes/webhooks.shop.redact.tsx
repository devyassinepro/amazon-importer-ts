/**
 * GDPR Webhook: shop/redact
 * Required for Shopify App Store approval
 *
 * This webhook is triggered 48 hours after a shop uninstalls your app.
 * You must delete all shop data at this point (final cleanup).
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

// Handle GET requests (for verification)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return new Response(JSON.stringify({
    webhook: "shop/redact",
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

  console.log(`🗑️  Received ${topic} webhook for ${shop}`);
  console.log(`Shop redact payload:`, payload);

  try {
    const shopDomain = (payload as any).shop_domain || shop;
    const shopId = (payload as any).shop_id;

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

  } catch (error) {
    console.error(`❌ Error processing shop redact for ${shop}:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
