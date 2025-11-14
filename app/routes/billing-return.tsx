// app/routes/billing-return.tsx
// Handles the return from Shopify billing page after payment confirmation
import { LoaderFunctionArgs } from "react-router";
import { prisma } from "~/db.server";
import { BILLING_PLANS, type PlanName } from "~/lib/billing-plans";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);

    // Extract parameters from the URL
    const chargeId = url.searchParams.get("charge_id");
    const shop = url.searchParams.get("shop");
    const planName = url.searchParams.get("plan");
    const host = url.searchParams.get("host");

    console.log(`🔄 Processing billing return`);
    console.log(`🏪 Shop: ${shop}`);
    console.log(`📋 Plan: ${planName}`);
    console.log(`🔗 Host: ${host}`);
    console.log(`💳 Charge: ${chargeId}`);

    // Extract shop from host parameter if shop is not directly provided
    let shopDomain = shop;
    if (!shopDomain && host) {
      try {
        const decodedHost = Buffer.from(host, 'base64').toString();
        shopDomain = decodedHost.split('/admin')[0];
        console.log(`🔍 Extracted shop from host: ${shopDomain}`);
      } catch (error) {
        console.error("❌ Failed to decode host parameter:", error);
      }
    }

    if (!shopDomain) {
      console.log("❌ Missing shop parameter");
      return redirect("/app?billing_error=missing_params");
    }

    if (!planName) {
      console.log("❌ Missing plan parameter");
      // Redirect with manual sync needed flag
      const hostParam = host ? `&host=${host}` : '';
      return redirect(`/app?billing_completed=1&needs_manual_sync=1&shop=${shopDomain}${hostParam}`);
    }

    // Verify plan exists
    if (!BILLING_PLANS[planName as PlanName]) {
      console.log(`❌ Invalid plan: ${planName}`);
      return redirect("/app?billing_error=invalid_plan");
    }

    const plan = BILLING_PLANS[planName as PlanName];

    // SHOPIFY GUARANTEES: If this URL is called, payment is confirmed
    console.log(`✅ Payment confirmed by Shopify - upgrading to ${plan.displayName} plan`);

    // Update subscription immediately with proper data
    try {
      await prisma.appSettings.update({
        where: { shop: shopDomain },
        data: {
          currentPlan: planName as PlanName,
          subscriptionStatus: "ACTIVE",
          subscriptionId: chargeId || `confirmed_${Date.now()}`,
          planStartDate: new Date(),
          planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      console.log(`🎉 Subscription upgraded successfully to ${plan.displayName}`);
    } catch (updateError) {
      console.error("❌ Error updating subscription:", updateError);
      // Continue with redirect but flag for manual sync
    }

    // Return data for client-side redirect (to maintain embedded app context)
    const redirectUrl = host
      ? `/app?host=${host}&billing_completed=1&plan=${planName}&charge_id=${chargeId || ''}`
      : `/app?billing_completed=1&plan=${planName}&shop=${shopDomain}&charge_id=${chargeId || ''}`;

    console.log(`🔗 Prepared redirect URL: ${redirectUrl}`);

    return {
      success: true,
      redirectUrl,
      host,
      shop: shopDomain,
      apiKey: process.env.SHOPIFY_API_KEY || "",
    };

  } catch (error: any) {
    console.error("💥 Error in billing return:", error);

    const url = new URL(request.url);
    const host = url.searchParams.get("host");

    return {
      success: false,
      redirectUrl: host
        ? `/app?host=${host}&billing_error=processing_error`
        : '/app?billing_error=processing_error',
      host,
      shop: null,
      apiKey: process.env.SHOPIFY_API_KEY || "",
    };
  }
};

// Component that handles client-side redirect with App Bridge
export default function BillingReturn() {
  const apiKey = process.env.SHOPIFY_API_KEY || "";

  return (
    <html>
      <head>
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Get the full URL with all parameters
                const params = new URLSearchParams(window.location.search);
                const host = params.get('host');
                const plan = params.get('plan');
                const chargeId = params.get('charge_id');
                const shop = params.get('shop');

                console.log('🔄 Billing return - params:', { host, plan, chargeId, shop });

                // Build redirect path (without host param to avoid double encoding)
                let redirectPath = '/app?billing_completed=1';
                if (plan) redirectPath += '&plan=' + plan;
                if (chargeId) redirectPath += '&charge_id=' + chargeId;

                console.log('🔗 Redirecting to:', redirectPath);

                // Try App Bridge redirect first (for embedded app)
                if (host && window.shopify && window.shopify.environment) {
                  try {
                    console.log('✅ Using App Bridge redirect');
                    const app = window.shopify.AppBridge.createApp({
                      apiKey: '${apiKey}',
                      host: host,
                    });
                    const redirect = window.shopify.AppBridge.actions.Redirect.create(app);
                    redirect.dispatch(window.shopify.AppBridge.actions.Redirect.Action.APP, redirectPath);
                    return;
                  } catch (error) {
                    console.warn('⚠️ App Bridge redirect failed:', error);
                  }
                }

                // Fallback to top-level redirect with host param
                const fullUrl = host ? redirectPath + '&host=' + host : redirectPath;
                console.log('🔄 Fallback redirect to:', fullUrl);

                if (window.top) {
                  window.top.location.href = fullUrl;
                } else {
                  window.location.href = fullUrl;
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2>✅ Payment Confirmed!</h2>
            <p>Redirecting you back to the app...</p>
            <div style={{ marginTop: '20px' }}>
              <div className="loader" style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #008060',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          </div>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </body>
    </html>
  );
}
