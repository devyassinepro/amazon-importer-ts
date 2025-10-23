/**
 * GDPR Webhook: customers/data_request
 * Required for Shopify App Store approval
 *
 * This webhook is triggered when a shop owner requests customer data.
 * You must provide the customer's data in response.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  console.log(`📋 Received ${topic} webhook for ${shop}`);
  console.log(`Customer data request payload:`, payload);

  try {
    // For Amazon Importer, we don't store customer personal data
    // We only store shop data and product information

    // If you stored any customer data (emails, names, addresses, etc.),
    // you would need to query and return it here

    const customerId = (payload as any).customer?.id;
    const shopDomain = (payload as any).shop_domain;

    console.log(`Customer ID: ${customerId}`);
    console.log(`Shop Domain: ${shopDomain}`);

    // Log the request for compliance records
    console.log(`✅ Customer data request processed for ${shop}`);
    console.log(`Note: Amazon Importer does not store customer personal data`);

    return new Response(JSON.stringify({
      message: "Amazon Importer does not store customer personal data",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error(`❌ Error processing customer data request for ${shop}:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
