import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  let settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { shop: session.shop },
    });
  }

  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    amazonAffiliateId: (formData.get("amazonAffiliateId") as string) || null,
    affiliateModeEnabled: formData.get("affiliateModeEnabled") === "true",
    buttonText: (formData.get("buttonText") as string) || "Buy on Amazon",
    buttonEnabled: formData.get("buttonEnabled") === "true",
    buttonPosition: (formData.get("buttonPosition") as string) || "AFTER_BUY_NOW",
    pricingMode: (formData.get("pricingMode") as string) || "MULTIPLIER",
    pricingValue: parseFloat((formData.get("pricingValue") as string) || "1.0"),
    defaultImportMode: (formData.get("defaultImportMode") as string) || "DROPSHIPPING",
    termsAccepted: formData.get("termsAccepted") === "true",
    termsAcceptedAt: formData.get("termsAccepted") === "true" ? new Date() : null,
  };

  await prisma.appSettings.upsert({
    where: { shop: session.shop },
    create: { shop: session.shop, ...data },
    update: data,
  });

  return { success: true };
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [amazonAffiliateId, setAmazonAffiliateId] = useState(settings.amazonAffiliateId || "");
  const [affiliateModeEnabled, setAffiliateModeEnabled] = useState(settings.affiliateModeEnabled);
  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [buttonEnabled, setButtonEnabled] = useState(settings.buttonEnabled);
  const [buttonPosition, setButtonPosition] = useState(settings.buttonPosition);
  const [pricingMode, setPricingMode] = useState(settings.pricingMode);
  const [pricingValue, setPricingValue] = useState(settings.pricingValue);
  const [defaultImportMode, setDefaultImportMode] = useState(settings.defaultImportMode);
  const [termsAccepted, setTermsAccepted] = useState(settings.termsAccepted);

  const isLoading = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Settings saved successfully!");
    }
  }, [fetcher.data, shopify]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("amazonAffiliateId", amazonAffiliateId);
    formData.append("affiliateModeEnabled", affiliateModeEnabled.toString());
    formData.append("buttonText", buttonText);
    formData.append("buttonEnabled", buttonEnabled.toString());
    formData.append("buttonPosition", buttonPosition);
    formData.append("pricingMode", pricingMode);
    formData.append("pricingValue", pricingValue.toString());
    formData.append("defaultImportMode", defaultImportMode);
    formData.append("termsAccepted", termsAccepted.toString());
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="⚙️ Settings">
      <s-button slot="primary-action" href="/app">
        ← Back to Import
      </s-button>

      <s-stack direction="block" gap="base">
        {/* Header Banner */}
        <s-banner tone="info">
          <s-stack direction="block" gap="tight">
            <s-text weight="semibold">Configure your Amazon Importer settings</s-text>
            <s-paragraph>
              Set up your API keys, affiliate settings, and default pricing preferences below.
            </s-paragraph>
          </s-stack>
        </s-banner>

        <form onSubmit={handleSubmit}>
          <s-stack direction="block" gap="base">
            {/* 1. Affiliate Settings */}
            <s-section>
              <s-box padding="base" borderWidth="base" borderRadius="base" style={{ backgroundColor: "#f9fafb" }}>
                <s-stack direction="block" gap="base">
                  <s-text variant="headingMd" weight="semibold">
                    🟢 Amazon Affiliate Settings
                  </s-text>

                  <s-banner tone="success">
                    <s-paragraph>
                      <strong>Affiliate Mode</strong> allows you to earn commissions by redirecting customers to Amazon.
                      A "Buy on Amazon" button will appear on your product pages with your affiliate ID.
                    </s-paragraph>
                  </s-banner>

                  <s-checkbox
                    checked={affiliateModeEnabled}
                    onChange={(e: any) => setAffiliateModeEnabled(e.target.checked)}
                  >
                    <s-text weight="semibold">Enable Affiliate Mode by Default</s-text>
                  </s-checkbox>

                  {affiliateModeEnabled && (
                    <s-stack direction="block" gap="base" style={{ marginTop: "12px" }}>
                      <s-text-field
                        label="Amazon Affiliate ID"
                        value={amazonAffiliateId}
                        onChange={(e: any) => setAmazonAffiliateId(e.target.value)}
                        placeholder="your-affiliate-id-20"
                        helptext="Your Amazon Associates affiliate tag (e.g., 'yourstore-20')"
                      ></s-text-field>

                      <s-divider />

                      <s-text weight="semibold" size="large">Button Customization</s-text>

                      <s-text-field
                        label="Button Text"
                        value={buttonText}
                        onChange={(e: any) => setButtonText(e.target.value)}
                        placeholder="Buy on Amazon"
                        helptext="Customize the text that appears on the Amazon redirect button"
                      ></s-text-field>

                      <s-checkbox
                        checked={buttonEnabled}
                        onChange={(e: any) => setButtonEnabled(e.target.checked)}
                      >
                        Show "Buy on Amazon" button on product pages
                      </s-checkbox>

                      <s-select
                        label="Button Position"
                        value={buttonPosition}
                        onChange={(e: any) => setButtonPosition(e.target.value)}
                        helptext="Choose where the button should appear on your product pages"
                      >
                        <option value="BEFORE_BUY_NOW">📍 Before "Buy Now" button</option>
                        <option value="AFTER_BUY_NOW">📍 After "Buy Now" button (recommended)</option>
                        <option value="AFTER_ADD_TO_CART">📍 After "Add to Cart" button</option>
                      </s-select>

                      <s-banner tone="warning">
                        <s-paragraph>
                          <strong>Note:</strong> Make sure you comply with Amazon Associates Program Operating Agreement.
                          You must disclose your affiliate relationship to customers.
                        </s-paragraph>
                      </s-banner>
                    </s-stack>
                  )}
                </s-stack>
              </s-box>
            </s-section>

            {/* 3. Pricing Settings */}
            <s-section>
              <s-box padding="base" borderWidth="base" borderRadius="base" style={{ backgroundColor: "#f9fafb" }}>
                <s-stack direction="block" gap="base">
                  <s-text variant="headingMd" weight="semibold">
                    💰 Default Pricing Settings
                  </s-text>

                  <s-banner tone="info">
                    <s-paragraph>
                      These settings will be used as defaults when importing products.
                      You can override them for individual products during import.
                    </s-paragraph>
                  </s-banner>

                  <s-stack direction="block" gap="base">
                    {/* Pricing Mode Selector */}
                    <s-box>
                      <s-text weight="semibold" size="large">Pricing Method</s-text>
                      <s-stack direction="block" gap="base" style={{ marginTop: "12px" }}>
                        {/* Multiplier Option */}
                        <s-box
                          padding="base"
                          borderWidth="base"
                          borderRadius="base"
                          style={{
                            borderColor: pricingMode === "MULTIPLIER" ? "#008060" : "#e1e3e5",
                            backgroundColor: pricingMode === "MULTIPLIER" ? "#f6f6f7" : "transparent",
                            cursor: "pointer",
                          }}
                          onClick={() => setPricingMode("MULTIPLIER")}
                        >
                          <s-stack direction="inline" gap="base" align="start">
                            <input
                              type="radio"
                              name="pricingMode"
                              value="MULTIPLIER"
                              checked={pricingMode === "MULTIPLIER"}
                              onChange={() => setPricingMode("MULTIPLIER")}
                              style={{ marginTop: "3px" }}
                            />
                            <s-stack direction="block" gap="tight">
                              <s-text weight="semibold" size="large">📊 Percentage Markup</s-text>
                              <s-paragraph>
                                Multiply the Amazon price by a factor. Perfect for maintaining consistent profit margins.
                              </s-paragraph>
                              <s-paragraph tone="subdued" size="small">
                                Example: 1.5 = 50% markup | 2.0 = 100% markup | 1.3 = 30% markup
                              </s-paragraph>
                            </s-stack>
                          </s-stack>
                        </s-box>

                        {/* Fixed Option */}
                        <s-box
                          padding="base"
                          borderWidth="base"
                          borderRadius="base"
                          style={{
                            borderColor: pricingMode === "FIXED" ? "#008060" : "#e1e3e5",
                            backgroundColor: pricingMode === "FIXED" ? "#f6f6f7" : "transparent",
                            cursor: "pointer",
                          }}
                          onClick={() => setPricingMode("FIXED")}
                        >
                          <s-stack direction="inline" gap="base" align="start">
                            <input
                              type="radio"
                              name="pricingMode"
                              value="FIXED"
                              checked={pricingMode === "FIXED"}
                              onChange={() => setPricingMode("FIXED")}
                              style={{ marginTop: "3px" }}
                            />
                            <s-stack direction="block" gap="tight">
                              <s-text weight="semibold" size="large">💵 Fixed Amount</s-text>
                              <s-paragraph>
                                Add a fixed dollar amount to the Amazon price. Good for consistent profit per item.
                              </s-paragraph>
                              <s-paragraph tone="subdued" size="small">
                                Example: $10 = Add $10 to every product | $5.50 = Add $5.50 to every product
                              </s-paragraph>
                            </s-stack>
                          </s-stack>
                        </s-box>
                      </s-stack>
                    </s-box>

                    {/* Pricing Value Input */}
                    <s-text-field
                      type="number"
                      label={pricingMode === "MULTIPLIER" ? "Default Multiplier Value" : "Default Fixed Amount ($)"}
                      value={pricingValue.toString()}
                      onChange={(e: any) => setPricingValue(parseFloat(e.target.value) || 1.0)}
                      min={pricingMode === "MULTIPLIER" ? "1.0" : "0"}
                      step={pricingMode === "MULTIPLIER" ? "0.1" : "0.01"}
                      helptext={
                        pricingMode === "MULTIPLIER"
                          ? "Enter a multiplier (1.0 = no markup, 1.5 = 50% markup, 2.0 = 100% markup)"
                          : "Enter the dollar amount to add to the Amazon price (e.g., 10.00 for $10)"
                      }
                    ></s-text-field>

                    {/* Pricing Preview */}
                    {pricingMode === "MULTIPLIER" && pricingValue > 1 && (
                      <s-banner tone="success">
                        <s-text>
                          <strong>Preview:</strong> Amazon price of $100.00 → Your price: $
                          {(100 * pricingValue).toFixed(2)} (
                          {((pricingValue - 1) * 100).toFixed(0)}% markup)
                        </s-text>
                      </s-banner>
                    )}
                    {pricingMode === "FIXED" && pricingValue > 0 && (
                      <s-banner tone="success">
                        <s-text>
                          <strong>Preview:</strong> Amazon price of $100.00 → Your price: $
                          {(100 + pricingValue).toFixed(2)} (+${pricingValue.toFixed(2)})
                        </s-text>
                      </s-banner>
                    )}

                    <s-divider />

                    {/* Default Import Mode */}
                    <s-select
                      label="Default Import Mode"
                      value={defaultImportMode}
                      onChange={(e: any) => setDefaultImportMode(e.target.value)}
                      helptext="Choose the default mode when importing new products"
                    >
                      <option value="DROPSHIPPING">🛒 Dropshipping (custom pricing, direct sales)</option>
                      <option value="AFFILIATE">🟢 Affiliate (original price, earn commissions)</option>
                    </s-select>
                  </s-stack>
                </s-stack>
              </s-box>
            </s-section>

            {/* 4. Terms & Conditions */}
            <s-section>
              <s-box padding="base" borderWidth="base" borderRadius="base" style={{ backgroundColor: "#f9fafb" }}>
                <s-stack direction="block" gap="base">
                  <s-text variant="headingMd" weight="semibold">
                    📜 Terms & Conditions
                  </s-text>

                  <s-banner tone="warning">
                    <s-paragraph>
                      By using this application, you acknowledge that you have read and agree to comply with all
                      applicable laws and Amazon's policies regarding product imports and resale.
                    </s-paragraph>
                  </s-banner>

                  <s-checkbox
                    checked={termsAccepted}
                    onChange={(e: any) => setTermsAccepted(e.target.checked)}
                  >
                    <s-text weight="semibold">
                      I accept the Terms & Conditions for importing Amazon products
                    </s-text>
                  </s-checkbox>

                  {termsAccepted && settings.termsAcceptedAt && (
                    <s-banner tone="success">
                      <s-paragraph size="small">
                        ✅ Terms accepted on: {new Date(settings.termsAcceptedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </s-paragraph>
                    </s-banner>
                  )}
                </s-stack>
              </s-box>
            </s-section>

            {/* Save Button */}
            <s-section>
              <s-stack direction="inline" gap="base" align="end">
                <s-button
                  type="submit"
                  variant="primary"
                  {...(isLoading ? { loading: true } : {})}
                >
                  💾 Save Settings
                </s-button>
                <s-button href="/app" variant="plain">
                  Cancel
                </s-button>
              </s-stack>
            </s-section>
          </s-stack>
        </form>
      </s-stack>
    </s-page>
  );
}

export const headers = boundary.headers;
