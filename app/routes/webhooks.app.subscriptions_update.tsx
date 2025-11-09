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
    console.log(`💰 Subscription ID: ${subscriptionData.id}`);

    if (subscriptionData.status === "CANCELLED" || subscriptionData.status === "EXPIRED") {
      console.log("🚫 Subscription cancelled/expired - reverting to free plan");

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
      // Extract pricing information
      const lineItems = subscriptionData.line_items || [];
      if (lineItems.length === 0) {
        console.error("❌ No line items found in subscription");
        return new Response("No line items", { status: 400 });
      }

      const amount = parseFloat(lineItems[0]?.pricing_details?.price?.amount || "0");
      console.log(`💵 Subscription amount: €${amount}`);

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

      await prisma.appSettings.update({
        where: { shop },
        data: {
          currentPlan: detectedPlan,
          subscriptionStatus: subscriptionData.status,
          subscriptionId: subscriptionData.id,
          planStartDate: new Date(),
          planEndDate: currentPeriodEnd,
        },
      });

      console.log(`✅ Updated subscription to ${detectedPlan} plan`);
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
