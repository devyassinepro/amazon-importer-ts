/**
 * Billing Page
 * Display subscription plans and manage upgrades
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getBillingStatus, createSubscription, confirmSubscription } from "~/services/billing.server";
import { BILLING_PLANS, type PlanName } from "~/lib/billing-plans";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Check if returning from subscription confirmation
  const url = new URL(request.url);
  const planParam = url.searchParams.get("plan");
  const chargeId = url.searchParams.get("charge_id");

  const billingStatus = await getBillingStatus(session.shop);

  return {
    billingStatus,
    confirmingPlan: planParam,
    chargeId,
    shop: session.shop,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "subscribe") {
    const planName = formData.get("plan") as PlanName;

    try {
      const result = await createSubscription(admin, session.shop, planName);

      if (planName === "FREE") {
        return { success: true, message: "Switched to Free Plan" };
      }

      // Return confirmation URL for paid plans
      return { success: true, confirmationUrl: result.confirmationUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  if (actionType === "confirm") {
    const planName = formData.get("plan") as PlanName;
    const subscriptionId = formData.get("subscriptionId") as string;

    try {
      await confirmSubscription(session.shop, planName, subscriptionId);
      return { success: true, message: `Successfully upgraded to ${planName} plan!` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: "Invalid action" };
};

export default function BillingPage() {
  const { billingStatus, confirmingPlan, shop } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);

  // Handle subscription response
  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.confirmationUrl) {
      // Redirect to Shopify confirmation page
      window.top!.location.href = fetcher.data.confirmationUrl;
    } else if (fetcher.data?.success && fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message, { duration: 3000 });
      navigate("/app");
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data]);

  const handleSelectPlan = (planName: PlanName) => {
    setSelectedPlan(planName);
    const formData = new FormData();
    formData.append("action", "subscribe");
    formData.append("plan", planName);
    fetcher.submit(formData, { method: "POST" });
  };

  const plans = Object.values(BILLING_PLANS);

  return (
    <s-page title="💰 Subscription Plans">
      {/* Page Subtitle */}
      <s-section>
        <s-text tone="subdued">Choose the plan that fits your business</s-text>
      </s-section>

      {/* Development Mode Banner */}
      {process.env.NODE_ENV !== "production" && (
        <s-section>
          <s-banner tone="warning">
            <s-text weight="semibold">🧪 Development Mode</s-text>
            <s-paragraph tone="subdued">
              App is not publicly distributed yet. Billing changes will be simulated for testing purposes.
              Real billing will work once the app is published to Shopify App Store.
            </s-paragraph>
          </s-banner>
        </s-section>
      )}

      {/* Current Plan Status */}
      <s-section>
        <s-banner tone="info">
          <s-stack direction="block" gap="small">
            <s-text weight="semibold" size="large">
              Current Plan: {billingStatus.planDetails.displayName}
            </s-text>
            <s-text>
              📦 Products: {billingStatus.productCount} / {billingStatus.productLimit} used
              ({billingStatus.remaining} remaining)
            </s-text>
            {billingStatus.remaining <= 5 && billingStatus.remaining > 0 && (
              <s-text tone="critical">
                ⚠️ You're close to your product limit! Consider upgrading.
              </s-text>
            )}
            {billingStatus.remaining === 0 && (
              <s-text tone="critical">
                🚫 You've reached your product limit! Upgrade to import more products.
              </s-text>
            )}
          </s-stack>
        </s-banner>
      </s-section>

      {/* Plans Grid */}
      <s-section heading="Available Plans">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {plans.map((plan) => {
            const isCurrent = billingStatus.currentPlan === plan.name;
            const isLoading = fetcher.state !== "idle" && selectedPlan === plan.name;

            return (
              <div
                key={plan.name}
                style={{
                  border: plan.popular
                    ? "2px solid #008060"
                    : isCurrent
                    ? "2px solid #5C6AC4"
                    : "1px solid #e1e3e5",
                  borderRadius: "12px",
                  padding: "24px",
                  background: plan.popular
                    ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                    : isCurrent
                    ? "#f6f6f7"
                    : "white",
                  position: "relative",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: isCurrent ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(0, 0, 0, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      right: "20px",
                      background: "#008060",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    ⭐ Most Popular
                  </div>
                )}

                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "20px",
                      background: "#5C6AC4",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    ✅ Current Plan
                  </div>
                )}

                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#202223",
                  }}
                >
                  {plan.displayName}
                </h3>

                <p
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    color: "#6d7175",
                  }}
                >
                  {plan.description}
                </p>

                <div style={{ marginBottom: "20px" }}>
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: "700",
                      color: "#202223",
                    }}
                  >
                    {plan.price === 0 ? "Free" : `€${plan.price.toFixed(2)}`}
                  </span>
                  {plan.price > 0 && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#6d7175",
                        marginLeft: "4px",
                      }}
                    >
                      /month
                    </span>
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e1e3e5",
                    paddingTop: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <strong style={{ fontSize: "16px", color: "#202223" }}>
                      📦 {plan.productLimit} imports / month
                    </strong>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {plan.features.buyOnAmazonButton ? (
                        <span style={{ color: "#008060" }}>✅</span>
                      ) : (
                        <span style={{ color: "#bf0711" }}>❌</span>
                      )}
                      <span style={{ fontSize: "14px", color: "#202223" }}>
                       Affiliate Mode
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {plan.features.dropshippingAllowed ? (
                        <span style={{ color: "#008060" }}>✅</span>
                      ) : (
                        <span style={{ color: "#bf0711" }}>❌</span>
                      )}
                      <span style={{ fontSize: "14px", color: "#202223" }}>
                        Dropshipping Mode
                      </span>
                    </div>
                  </div>
                </div>

                <s-button
                  variant={plan.popular && !isCurrent ? "primary" : "secondary"}
                  disabled={isCurrent}
                  loading={isLoading}
                  onClick={() => handleSelectPlan(plan.name)}
                  style={{ width: "100%" }}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.price === 0
                    ? "Downgrade to Free"
                    : `Upgrade to ${plan.displayName}`}
                </s-button>
              </div>
            );
          })}
        </div>
      </s-section>

      {/* FAQ Section */}
      <s-section heading="❓ Frequently Asked Questions">
        <s-stack direction="block" gap="base">
          <div>
            <s-text weight="semibold">Can I change plans at any time?</s-text>
            <s-paragraph tone="subdued">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </s-paragraph>
          </div>

          <s-divider />

          <div>
            <s-text weight="semibold">What happens if I reach my product limit?</s-text>
            <s-paragraph tone="subdued">
              You won't be able to import new products until you upgrade to a higher plan or delete existing products.
            </s-paragraph>
          </div>

          <s-divider />

          <div>
            <s-text weight="semibold">Are these test charges?</s-text>
            <s-paragraph tone="subdued">
              {process.env.NODE_ENV === "development"
                ? "Yes, during development all charges are test charges and won't charge your card."
                : "No, these are real charges that will appear on your Shopify bill."}
            </s-paragraph>
          </div>

          <s-divider />

          <div>
            <s-text weight="semibold">Do imported products count towards my limit?</s-text>
            <s-paragraph tone="subdued">
              Yes, every product you import (both in Draft and Active status) counts towards your plan limit.
            </s-paragraph>
          </div>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = boundary.headers;
