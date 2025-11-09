/**
 * Billing Service
 * Handles Shopify Billing API interactions
 * Inspired by Pricefy billing system
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";
import { BILLING_PLANS, type PlanName } from "~/lib/billing-plans";

export interface BillingResult {
  success: boolean;
  confirmationUrl?: string;
  subscriptionId?: string;
  error?: string;
  requiresPayment?: boolean;
}

/**
 * Create a Shopify subscription for a plan
 */
export async function createSubscription(
  admin: AdminApiContext,
  shop: string,
  planName: PlanName
): Promise<BillingResult> {
  try {
    const plan = BILLING_PLANS[planName];

    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    // Free plan doesn't require Shopify subscription
    if (planName === "FREE") {
      await prisma.appSettings.update({
        where: { shop },
        data: {
          currentPlan: "FREE",
          subscriptionStatus: "ACTIVE",
          planStartDate: new Date(),
          subscriptionId: null,
        },
      });
      return { success: true };
    }

    // Create return URL - EXACTLY like Pricefy
    // Point to billing-return route which will handle subscription update, then redirect to /app
    const appUrl = process.env.SHOPIFY_APP_URL || `https://${shop}/admin/apps/${process.env.SHOPIFY_APP_HANDLE || "amazon-importer"}`;
    const returnUrl = `${appUrl}/billing-return?shop=${shop}&plan=${planName}`;

    console.log(`🔄 Creating subscription for ${shop}:`, {
      plan: plan.displayName,
      price: plan.price,
      returnUrl,
    });

    // Create Shopify subscription
    const response = await admin.graphql(
      `#graphql
        mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $test: Boolean!, $lineItems: [AppSubscriptionLineItemInput!]!) {
          appSubscriptionCreate(
            name: $name
            returnUrl: $returnUrl
            test: $test
            lineItems: $lineItems
          ) {
            appSubscription {
              id
              name
              status
              currentPeriodEnd
            }
            confirmationUrl
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          name: `${plan.displayName} Plan`,
          returnUrl,
          test: process.env.NODE_ENV !== "production", // Test mode in development
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: plan.price, currencyCode: "EUR" },
                  interval: plan.interval,
                },
              },
            },
          ],
        },
      }
    );

    const data = await response.json();

    if (data.data?.appSubscriptionCreate?.userErrors?.length > 0) {
      const errors = data.data.appSubscriptionCreate.userErrors;
      console.error('Subscription creation errors:', errors);

      // Check if error is due to app not being publicly distributed
      const isPublicDistributionError = errors.some((e: any) =>
        e.message?.includes('public distribution') ||
        e.message?.includes('Billing API')
      );

      if (isPublicDistributionError && process.env.NODE_ENV !== "production") {
        // In development, simulate subscription for testing
        console.log('⚠️  App not publicly distributed - simulating subscription for development');

        await prisma.appSettings.update({
          where: { shop },
          data: {
            currentPlan: planName,
            subscriptionStatus: "ACTIVE",
            planStartDate: new Date(),
            subscriptionId: `dev_subscription_${Date.now()}`,
          },
        });

        return {
          success: true,
          confirmationUrl: returnUrl + '&dev_mode=1'
        };
      }

      return {
        success: false,
        error: errors.map((e: any) => e.message).join(', ')
      };
    }

    const subscriptionData = data.data?.appSubscriptionCreate?.appSubscription;
    const confirmationUrl = data.data?.appSubscriptionCreate?.confirmationUrl;

    if (!confirmationUrl) {
      return {
        success: false,
        error: "No confirmation URL returned from Shopify"
      };
    }

    // Save subscription ID for future reference with pending status
    if (subscriptionData?.id) {
      await prisma.appSettings.update({
        where: { shop },
        data: {
          subscriptionId: subscriptionData.id,
          currentPlan: planName,
          subscriptionStatus: "PENDING", // Pending until confirmed
        },
      });
    }

    console.log(`✅ Subscription created successfully`);
    console.log(`🔗 Confirmation URL: ${confirmationUrl}`);

    return {
      success: true,
      confirmationUrl,
      subscriptionId: subscriptionData?.id,
      requiresPayment: true
    };

  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return {
      success: false,
      error: `Failed to create subscription: ${error.message}`
    };
  }
}

/**
 * Cancel current subscription
 */
export async function cancelSubscription(
  admin: AdminApiContext,
  subscriptionId: string
) {
  const response = await admin.graphql(
    `#graphql
      mutation AppSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        id: subscriptionId,
      },
    }
  );

  const data = await response.json();

  if (data.data?.appSubscriptionCancel?.userErrors?.length > 0) {
    throw new Error(
      data.data.appSubscriptionCancel.userErrors[0].message
    );
  }

  return data.data?.appSubscriptionCancel?.appSubscription;
}

/**
 * Confirm subscription after user approves
 */
export async function confirmSubscription(
  shop: string,
  planName: PlanName,
  subscriptionId: string
) {
  await prisma.appSettings.update({
    where: { shop },
    data: {
      currentPlan: planName,
      subscriptionId,
      subscriptionStatus: "ACTIVE",
      planStartDate: new Date(),
    },
  });
}

/**
 * Check if user has reached product limit
 */
export async function checkProductLimit(shop: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  plan: PlanName;
}> {
  const settings = await prisma.appSettings.findUnique({
    where: { shop },
  });

  const currentPlan = (settings?.currentPlan as PlanName) || "FREE";
  const plan = BILLING_PLANS[currentPlan];

  const currentCount = await prisma.importedProduct.count({
    where: { shop },
  });

  const remaining = Math.max(0, plan.productLimit - currentCount);
  const allowed = currentCount < plan.productLimit;

  return {
    allowed,
    currentCount,
    limit: plan.productLimit,
    remaining,
    plan: currentPlan,
  };
}

/**
 * Get current billing status
 */
export async function getBillingStatus(shop: string) {
  const settings = await prisma.appSettings.findUnique({
    where: { shop },
  });

  const currentPlan = (settings?.currentPlan as PlanName) || "FREE";
  const productCount = await prisma.importedProduct.count({
    where: { shop },
  });

  return {
    currentPlan,
    planDetails: BILLING_PLANS[currentPlan],
    subscriptionId: settings?.subscriptionId,
    subscriptionStatus: settings?.subscriptionStatus,
    productCount,
    productLimit: BILLING_PLANS[currentPlan].productLimit,
    remaining: Math.max(0, BILLING_PLANS[currentPlan].productLimit - productCount),
  };
}

/**
 * Get active subscriptions from Shopify
 */
export async function getActiveSubscriptions(admin: AdminApiContext): Promise<any[]> {
  try {
    const query = `
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
    `;

    const response = await admin.graphql(query);
    const result = await response.json();

    return result.data?.app?.installation?.activeSubscriptions || [];

  } catch (error: any) {
    console.error('Error fetching active subscriptions:', error);
    return [];
  }
}

/**
 * Sync subscription with Shopify - EXACTLY like Pricefy
 */
export async function syncSubscriptionWithShopify(
  admin: AdminApiContext,
  shop: string
): Promise<{ success: boolean; syncedPlan?: string; error?: string }> {
  try {
    console.log(`🔄 Syncing subscription for ${shop}...`);

    const activeSubscriptions = await getActiveSubscriptions(admin);

    if (activeSubscriptions.length === 0) {
      // No active subscription -> free plan
      await prisma.appSettings.update({
        where: { shop },
        data: {
          currentPlan: "FREE",
          subscriptionStatus: "ACTIVE",
          planStartDate: new Date(),
          subscriptionId: null,
        },
      });

      console.log(`✅ No active subscription - synced to FREE plan`);
      return { success: true, syncedPlan: "FREE" };
    }

    // Take the first active subscription
    const subscription = activeSubscriptions[0];
    const amount = parseFloat(subscription.lineItems?.[0]?.plan?.pricingDetails?.price?.amount || "0");

    // Map amount to corresponding plan
    let detectedPlan: PlanName = "FREE";
    for (const [planKey, planData] of Object.entries(BILLING_PLANS)) {
      if (Math.abs(planData.price - amount) < 0.02) {
        detectedPlan = planKey as PlanName;
        break;
      }
    }

    // Update local subscription
    await prisma.appSettings.update({
      where: { shop },
      data: {
        currentPlan: detectedPlan,
        subscriptionStatus: subscription.status.toUpperCase(),
        subscriptionId: subscription.id,
        planStartDate: new Date(),
        planEndDate: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : undefined,
      },
    });

    console.log(`✅ Subscription synced to ${detectedPlan} plan`);
    return { success: true, syncedPlan: detectedPlan };

  } catch (error: any) {
    console.error('Error syncing subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
