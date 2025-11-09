// app/routes/webhooks.app.subscription_charges_success.tsx
// Alternative: Use webhook to handle approved payments

import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/db.server";
import { BILLING_PLANS, type PlanName } from "~/lib/billing-plans";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🔄 Subscription charge success webhook received");

  try {
    // Read webhook payload
    const payload = await request.text();
    console.log(`📦 Webhook payload:`, payload);

    // Parse data
    const data = JSON.parse(payload);
    const charge = data.app_recurring_application_charge || data.app_subscription;

    if (!charge) {
      console.error("❌ No charge data in webhook payload");
      return new Response("Missing charge data", { status: 400 });
    }

    const shop = data.shop_domain || charge.shop_domain;
    const amount = parseFloat(charge.price?.amount || charge.line_items?.[0]?.plan?.pricing_details?.price?.amount || "0");
    const status = charge.status;
    const chargeId = charge.id;

    console.log(`📋 Processing charge for ${shop}:`);
    console.log(`💰 Amount: €${amount}`);
    console.log(`📊 Status: ${status}`);
    console.log(`🆔 ID: ${chargeId}`);

    if (status === "active" || status === "ACTIVE") {
      // Map amount to corresponding plan
      let detectedPlan: PlanName = "FREE";
      for (const [planKey, planData] of Object.entries(BILLING_PLANS)) {
        if (Math.abs(planData.price - amount) < 0.02) {
          detectedPlan = planKey as PlanName;
          break;
        }
      }

      console.log(`✅ Updating subscription to ${detectedPlan} plan`);

      await prisma.appSettings.update({
        where: { shop },
        data: {
          currentPlan: detectedPlan,
          subscriptionStatus: "ACTIVE",
          subscriptionId: chargeId.toString(),
          planStartDate: new Date(),
          planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      console.log(`✅ Subscription updated successfully for ${shop}`);
    }

    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
