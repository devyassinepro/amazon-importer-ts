/**
 * Auto-sync billing subscription with Shopify
 * Inspired by Pricefy's auto-sync system
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";
import { BILLING_PLANS, type PlanName } from "./billing-plans";

export interface SyncResult {
  success: boolean;
  syncedPlan?: string;
  message?: string;
  error?: string;
  source?: 'AppSubscription' | 'AppRecurringApplicationCharge' | 'none';
}

/**
 * Automatically synchronize subscription with Shopify
 */
export async function autoSyncSubscription(admin: AdminApiContext, shop: string): Promise<SyncResult> {
  try {
    console.log(`🔄 Auto-syncing subscription for ${shop}...`);

    // 1. First check AppSubscriptions
    const subscriptionResult = await syncFromAppSubscriptions(admin, shop);
    if (subscriptionResult.success) {
      return subscriptionResult;
    }

    // 2. If not found, try AppRecurringApplicationCharges
    const chargeResult = await syncFromAppCharges(admin, shop);
    if (chargeResult.success) {
      return chargeResult;
    }

    // 3. No active billing found - stay on free
    console.log(`ℹ️ No active billing found for ${shop} - keeping free plan`);

    await prisma.appSettings.update({
      where: { shop },
      data: {
        currentPlan: "FREE",
        subscriptionStatus: "ACTIVE",
        subscriptionId: null,
        planStartDate: new Date(),
      },
    });

    return {
      success: true,
      syncedPlan: "FREE",
      message: "No active subscription found - confirmed free plan",
      source: 'none'
    };

  } catch (error: any) {
    console.error(`❌ Auto-sync failed for ${shop}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sync from AppSubscriptions
 */
async function syncFromAppSubscriptions(admin: AdminApiContext, shop: string): Promise<SyncResult> {
  try {
    const response = await admin.graphql(`
      query GetActiveSubscriptions {
        app {
          installation {
            activeSubscriptions {
              id
              name
              status
              currentPeriodEnd
              lineItems {
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      price {
                        amount
                        currencyCode
                      }
                      interval
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const data = await response.json();
    const activeSubscriptions = data.data?.app?.installation?.activeSubscriptions || [];

    if (activeSubscriptions.length === 0) {
      return { success: false, message: "No AppSubscriptions found" };
    }

    const subscription = activeSubscriptions[0];

    if (subscription.status !== "ACTIVE") {
      return { success: false, message: `AppSubscription status: ${subscription.status}` };
    }

    const amount = parseFloat(subscription.lineItems?.[0]?.plan?.pricingDetails?.price?.amount || "0");
    console.log(`💰 Found AppSubscription with amount: ${amount}`);

    // Map to plan
    const detectedPlan = mapAmountToPlan(amount);

    if (detectedPlan === "FREE" && amount > 0) {
      return { success: false, message: `Unknown amount: ${amount}` };
    }

    // Update local subscription
    await prisma.appSettings.update({
      where: { shop },
      data: {
        currentPlan: detectedPlan,
        subscriptionStatus: "ACTIVE",
        subscriptionId: subscription.id,
        planStartDate: new Date(),
        planEndDate: subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`✅ Synced from AppSubscription to ${detectedPlan} plan`);

    return {
      success: true,
      syncedPlan: detectedPlan,
      message: `Synced from AppSubscription: ${BILLING_PLANS[detectedPlan].displayName} ($${amount})`,
      source: 'AppSubscription'
    };

  } catch (error: any) {
    console.log(`ℹ️ AppSubscription sync failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Sync from AppRecurringApplicationCharges
 */
async function syncFromAppCharges(admin: AdminApiContext, shop: string): Promise<SyncResult> {
  try {
    const response = await admin.graphql(`
      query GetAppRecurringApplicationCharges($first: Int!) {
        appRecurringApplicationCharges(first: $first) {
          edges {
            node {
              id
              name
              price {
                amount
                currencyCode
              }
              status
              createdAt
              activatedOn
            }
          }
        }
      }
    `, {
      variables: { first: 10 }
    });

    const data = await response.json();
    const charges = data.data?.appRecurringApplicationCharges?.edges?.map((edge: any) => edge.node) || [];
    const activeCharges = charges.filter((charge: any) => charge.status === "active");

    if (activeCharges.length === 0) {
      return { success: false, message: "No active AppRecurringApplicationCharges found" };
    }

    const charge = activeCharges[0]; // Take the most recent
    const amount = parseFloat(charge.price?.amount || "0");
    console.log(`💰 Found AppRecurringApplicationCharge with amount: ${amount}`);

    // Map to plan
    const detectedPlan = mapAmountToPlan(amount);

    if (detectedPlan === "FREE" && amount > 0) {
      return { success: false, message: `Unknown amount: ${amount}` };
    }

    // Update local subscription
    await prisma.appSettings.update({
      where: { shop },
      data: {
        currentPlan: detectedPlan,
        subscriptionStatus: "ACTIVE",
        subscriptionId: charge.id,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`✅ Synced from AppRecurringApplicationCharge to ${detectedPlan} plan`);

    return {
      success: true,
      syncedPlan: detectedPlan,
      message: `Synced from AppRecurringApplicationCharge: ${BILLING_PLANS[detectedPlan].displayName} ($${amount})`,
      source: 'AppRecurringApplicationCharge'
    };

  } catch (error: any) {
    console.log(`ℹ️ AppRecurringApplicationCharge sync failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Map amount to plan with 2-cent tolerance
 */
function mapAmountToPlan(amount: number): PlanName {
  // Check each plan with a tolerance of 2 cents
  for (const [planKey, planData] of Object.entries(BILLING_PLANS)) {
    if (Math.abs(planData.price - amount) < 0.02) {
      return planKey as PlanName;
    }
  }

  // If no exact plan found, try approximate matching
  if (amount >= 19.50 && amount <= 20.50) return "PREMIUM"; // ~$19.99
  if (amount >= 9.50 && amount <= 10.50) return "PRO";      // ~$9.99
  if (amount >= 4.50 && amount <= 5.50) return "BASIC";     // ~$4.99
  if (amount < 0.50) return "FREE";                         // ~$0.00

  console.warn(`⚠️ Unknown price amount: ${amount} - defaulting to FREE`);
  return "FREE";
}
