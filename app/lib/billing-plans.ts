/**
 * Billing Plans Configuration
 * Define all available subscription plans
 */

export type PlanName = "FREE" | "BASIC" | "PRO" | "PREMIUM";

export interface BillingPlan {
  name: PlanName;
  displayName: string;
  price: number;
  interval: "EVERY_30_DAYS" | "ANNUAL";
  productLimit: number;
  features: {
    buyOnAmazonButton: boolean;
    dropshippingAllowed: boolean;
  };
  popular?: boolean;
  description: string;
}

export const BILLING_PLANS: Record<PlanName, BillingPlan> = {
  FREE: {
    name: "FREE",
    displayName: "Free Plan",
    price: 0,
    interval: "EVERY_30_DAYS",
    productLimit: 20,
    features: {
      buyOnAmazonButton: false,
      dropshippingAllowed: true,
    },
    description: "Perfect for testing and small catalogs",
  },
  BASIC: {
    name: "BASIC",
    displayName: "Basic Plan",
    price: 4.99,
    interval: "EVERY_30_DAYS",
    productLimit: 150,
    features: {
      buyOnAmazonButton: true,
      dropshippingAllowed: true,
    },
    description: "Great for growing stores",
  },
  PRO: {
    name: "PRO",
    displayName: "Pro Plan",
    price: 9.99,
    interval: "EVERY_30_DAYS",
    productLimit: 1000,
    features: {
      buyOnAmazonButton: true,
      dropshippingAllowed: true,
    },
    popular: true,
    description: "Most popular for established businesses",
  },
  PREMIUM: {
    name: "PREMIUM",
    displayName: "Premium Plan",
    price: 19.99,
    interval: "EVERY_30_DAYS",
    productLimit: 3000,
    features: {
      buyOnAmazonButton: true,
      dropshippingAllowed: true,
    },
    description: "For large scale operations",
  },
};

/**
 * Get plan details by name
 */
export function getPlan(planName: PlanName): BillingPlan {
  return BILLING_PLANS[planName];
}

/**
 * Check if a plan allows a specific feature
 */
export function canUseFeature(
  planName: PlanName,
  feature: keyof BillingPlan["features"]
): boolean {
  return BILLING_PLANS[planName].features[feature];
}

/**
 * Check if current product count is within plan limit
 */
export function isWithinLimit(planName: PlanName, currentCount: number): boolean {
  return currentCount < BILLING_PLANS[planName].productLimit;
}

/**
 * Get remaining products for a plan
 */
export function getRemainingProducts(planName: PlanName, currentCount: number): number {
  const limit = BILLING_PLANS[planName].productLimit;
  return Math.max(0, limit - currentCount);
}
