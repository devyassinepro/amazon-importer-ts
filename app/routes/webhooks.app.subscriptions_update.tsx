// app/routes/webhooks.app.subscriptions_update.tsx
// Handles subscription status updates from Shopify

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { BILLING_PLANS, type PlanName } from "~/lib/billing-plans";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🔄 App subscription update webhook received");

  try {
    const { payload, shop, topic } = await authenticate.webhook(request);

    console.log(`📋 Processing ${topic} for ${shop}`);
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

    const subscriptionData = payload.app_subscription;

    if (!subscriptionData) {
      console.error("❌ No subscription data in payload");
      return new Response("Missing subscription data", { status: 400 });
    }

    console.log(`🔍 Subscription status: ${subscriptionData.status}`);
    console.log(`💰 Subscription ID: ${subscriptionData.admin_graphql_api_id || subscriptionData.id}`);

    if (subscriptionData.status === "CANCELLED" || subscriptionData.status === "EXPIRED") {
      console.log("⚠️ Subscription cancelled/expired - checking for other active subscriptions before downgrading");

      // IMPORTANT: Don't immediately downgrade to FREE when CANCELLED
      // This could be part of an upgrade flow where the old plan is cancelled
      // and a new plan is being activated. Wait to see if there's another ACTIVE subscription.

      // Check current settings to see if we're in the middle of an upgrade
      const currentSettings = await prisma.appSettings.findUnique({
        where: { shop },
      });

      // If the cancelled subscription is NOT the current active one, ignore it
      // This means a new plan is already active
      const cancelledSubId = subscriptionData.admin_graphql_api_id || subscriptionData.id;
      if (currentSettings?.subscriptionId && currentSettings.subscriptionId !== cancelledSubId) {
        console.log(`ℹ️ Ignoring CANCELLED webhook for old subscription ${cancelledSubId} - newer subscription ${currentSettings.subscriptionId} is already active`);
        return new Response(null, { status: 200 });
      }

      // Only downgrade to FREE if this was the current active subscription
      // and we'll wait 30 seconds to see if a new ACTIVE webhook arrives
      const cancelledAt = new Date(subscriptionData.updated_at || Date.now());
      const now = new Date();
      const timeSinceCancellation = now.getTime() - cancelledAt.getTime();

      if (timeSinceCancellation < 30000) {
        console.log(`⏳ Subscription recently cancelled (${Math.floor(timeSinceCancellation / 1000)}s ago) - marking as PENDING to wait for potential upgrade`);

        await prisma.appSettings.update({
          where: { shop },
          data: {
            subscriptionStatus: "PENDING",
          },
        });

        console.log("✅ Marked as PENDING - will revert to FREE later if no upgrade occurs");
        return new Response(null, { status: 200 });
      }

      // If it's been more than 30 seconds, this is a real cancellation
      console.log("🚫 Confirmed cancellation - reverting to free plan");

      await prisma.appSettings.update({
        where: { shop },
        data: {
          currentPlan: "FREE",
          subscriptionStatus: "ACTIVE",
          subscriptionId: null,
          planStartDate: new Date(),
          planEndDate: null,
        },
      });

      console.log("✅ Reverted to free plan");
      return new Response(null, { status: 200 });
    }

    if (subscriptionData.status === "ACTIVE") {
      // Extract pricing information - try multiple sources
      let amount = 0;

      // Try line_items first (preferred)
      const lineItems = subscriptionData.line_items || [];
      if (lineItems.length > 0 && lineItems[0]?.pricing_details?.price?.amount) {
        amount = parseFloat(lineItems[0].pricing_details.price.amount);
        console.log(`💵 Subscription amount from line_items: $${amount}`);
      }
      // Fallback to direct price field (webhook payload format)
      else if (subscriptionData.price) {
        amount = parseFloat(subscriptionData.price);
        console.log(`💵 Subscription amount from price field: $${amount}`);
      } else {
        console.error("❌ No pricing information found in subscription");
        console.log("📦 Available fields:", Object.keys(subscriptionData));
        return new Response("No pricing information", { status: 400 });
      }

      if (amount === 0) {
        console.error("❌ Invalid subscription amount: $0");
        return new Response("Invalid amount", { status: 400 });
      }

      // Map amount to plan
      let detectedPlan: PlanName = "FREE";
      for (const [planKey, planData] of Object.entries(BILLING_PLANS)) {
        if (Math.abs(planData.price - amount) < 0.02) { // 2 cent tolerance
          detectedPlan = planKey as PlanName;
          break;
        }
      }

      console.log(`📊 Detected plan: ${detectedPlan}`);

      const currentPeriodEnd = subscriptionData.current_period_end
        ? new Date(subscriptionData.current_period_end)
        : undefined;

      // Use admin_graphql_api_id if available, otherwise use id
      const subscriptionId = subscriptionData.admin_graphql_api_id || subscriptionData.id;

      await prisma.appSettings.update({
        where: { shop },
        data: {
          currentPlan: detectedPlan,
          subscriptionStatus: "ACTIVE", // Force ACTIVE when we receive an ACTIVE webhook
          subscriptionId: subscriptionId,
          planStartDate: new Date(),
          planEndDate: currentPeriodEnd,
        },
      });

      console.log(`✅ Updated subscription to ${detectedPlan} plan (ID: ${subscriptionId})`);
      console.log(`📅 Plan period: ${new Date()} to ${currentPeriodEnd || 'ongoing'}`);
    }

    console.log("✅ Subscription update webhook processed successfully");
    return new Response(null, { status: 200 });

  } catch (error: any) {
    console.error("❌ Subscription update webhook error:", error);

    // Check for HMAC validation errors
    if (
      error.message?.toLowerCase().includes('unauthorized') ||
      error.message?.toLowerCase().includes('hmac') ||
      error.status === 401
    ) {
      console.log("🚨 HMAC validation failed - returning 401");
      return new Response("Unauthorized", { status: 401 });
    }

    // For other errors, return 500
    return new Response("Internal Server Error", { status: 500 });
  }
};
