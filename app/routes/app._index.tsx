import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";
import { scrapeAmazonProduct } from "~/services/amazon-scraper.server";
import { createShopifyProduct } from "~/services/shopify-product.server";
import { applyPricingMarkup } from "~/services/pricing.server";
import type { ImportMode, PricingMode, ScrapedProduct } from "~/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  let settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { shop: session.shop },
    });
  }

  const collectionsResponse = await admin.graphql(
    `#graphql
    query getCollections {
      collections(first: 250) {
        edges {
          node {
            id
            title
          }
        }
      }
    }`,
  );

  const collectionsData = await collectionsResponse.json();
  const collections = collectionsData.data.collections.edges.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
  }));

  return { settings, collections };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "acceptTerms") {
    await prisma.appSettings.update({
      where: { shop: session.shop },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    });
    return { action: "termsAccepted" };
  }

  if (actionType === "scrape") {
    const amazonUrl = formData.get("amazonUrl") as string;
    if (!amazonUrl) {
      return { error: "Amazon URL is required" };
    }

    const settings = await prisma.appSettings.findUnique({
      where: { shop: session.shop },
    });

    // Use environment variable for RapidAPI key
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      return {
        error: "RapidAPI key is not configured. Please contact the administrator.",
      };
    }

    const result = await scrapeAmazonProduct(amazonUrl, rapidApiKey);
    if (!result.success) {
      return { error: result.error };
    }

    const originalPrice = result.data!.price;
    const markedUpPrice = applyPricingMarkup(
      originalPrice,
      settings?.pricingMode as PricingMode,
      settings?.pricingValue || 1.0,
    );

    result.data!.price = markedUpPrice;
    (result.data as any).originalPrice = originalPrice;

    return {
      action: "scraped",
      productData: result.data,
      amazonUrl,
    };
  }

  if (actionType === "import") {
    const productDataJson = formData.get("productData") as string;
    const amazonUrl = formData.get("amazonUrl") as string;
    const shouldPublish = formData.get("publish") === "true";
    const collectionId = formData.get("collectionId") as string;
    const importMode = formData.get("importMode") as ImportMode;
    const markupValue = parseFloat(formData.get("markupValue") as string || "0");
    const markupType = formData.get("markupType") as PricingMode;

    const productData: ScrapedProduct = JSON.parse(productDataJson);
    const settings = await prisma.appSettings.findUnique({
      where: { shop: session.shop },
    });

    const result = await createShopifyProduct(
      admin,
      productData,
      amazonUrl,
      settings as any,
      shouldPublish,
      importMode,
    );
    if (!result.success) {
      return { error: result.error };
    }

    const product = result.product!;

    // Add to collection if specified
    if (collectionId && product.id) {
      try {
        await admin.graphql(
          `#graphql
          mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
            collectionAddProducts(id: $id, productIds: $productIds) {
              collection { id }
              userErrors { field message }
            }
          }`,
          { variables: { id: collectionId, productIds: [product.id] } },
        );
      } catch (error) {
        console.error("Error adding product to collection:", error);
      }
    }

    // Save to import history
    await prisma.importedProduct.create({
      data: {
        shop: session.shop,
        shopifyProductId: product.id,
        shopifyHandle: product.handle,
        shopifyVariantId: product.variants.edges[0]?.node?.id || null,
        amazonUrl,
        amazonAsin: productData.asin,
        title: productData.title,
        description: productData.description || "",
        price: productData.price,
        originalPrice: (productData as any).originalPrice || productData.price,
        markup: markupValue,
        markupType: markupType,
        importMode: importMode,
        productImage: productData.images?.[0] || null,
        images: JSON.stringify(productData.images || []),
        variantCount: productData.variants?.length || 1,
        status: shouldPublish ? "ACTIVE" : "DRAFT",
      },
    });

    return { action: "imported", product };
  }

  return { error: "Invalid action" };
};

export default function Index() {
  const { settings, collections } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [showTermsModal, setShowTermsModal] = useState(!settings.termsAccepted);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [importMode, setImportMode] = useState<ImportMode>(
    settings.defaultImportMode as ImportMode,
  );
  const [markupType, setMarkupType] = useState<PricingMode>(
    settings.pricingMode as PricingMode,
  );
  const [markupValue, setMarkupValue] = useState(settings.pricingValue);
  const [productStatus, setProductStatus] = useState<"DRAFT" | "ACTIVE">("DRAFT");
  const [selectedCollection, setSelectedCollection] = useState("");

  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
  const isFetching = isLoading && fetcher.formData?.get("action") === "scrape";

  useEffect(() => {
    if (fetcher.data?.action === "termsAccepted") {
      setShowTermsModal(false);
      shopify.toast.show("Terms accepted successfully!");
    } else if (fetcher.data?.action === "scraped" && fetcher.data.productData) {
      setProductData(fetcher.data.productData);
      setShowPreview(true);
      shopify.toast.show("Product fetched successfully!");
    } else if (fetcher.data?.action === "imported") {
      shopify.toast.show("Product imported successfully! 🎉");
      setShowPreview(false);
      setAmazonUrl("");
      setProductData(null);
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const handleScrape = () => {
    if (!amazonUrl.trim()) {
      shopify.toast.show("Please enter an Amazon URL", { isError: true });
      return;
    }

    if (!settings.termsAccepted) {
      shopify.toast.show("Please accept the terms first", { isError: true });
      setShowTermsModal(true);
      return;
    }

    setShowPreview(false);
    setProductData(null);
    const formData = new FormData();
    formData.append("action", "scrape");
    formData.append("amazonUrl", amazonUrl);
    fetcher.submit(formData, { method: "POST" });
  };

  const handleImport = () => {
    const formData = new FormData();
    formData.append("action", "import");
    formData.append("productData", JSON.stringify(productData));
    formData.append("amazonUrl", (fetcher.data as any)?.amazonUrl);
    formData.append("publish", (productStatus === "ACTIVE").toString());
    formData.append("collectionId", selectedCollection);
    formData.append("importMode", importMode);
    formData.append("markupValue", markupValue.toString());
    formData.append("markupType", markupType);
    fetcher.submit(formData, { method: "POST" });
  };

  const finalPrice =
    importMode === "AFFILIATE"
      ? productData?.originalPrice || 0
      : markupType === "MULTIPLIER"
        ? (productData?.originalPrice || 0) * markupValue
        : (productData?.originalPrice || 0) + markupValue;

  return (
    <>
      {/* Terms Modal */}
      {showTermsModal && (
        <s-modal
          open={showTermsModal}
          title="Terms of Importation"
          onClose={() => setShowTermsModal(false)}
        >
          <s-stack direction="block" gap="base" style={{ padding: "20px" }}>
            <s-paragraph>
              By using Amazon Importer, you agree to the following terms and conditions:
            </s-paragraph>

            <s-unordered-list>
              <s-list-item>
                You confirm that you have the necessary rights to import and sell products using this app.
              </s-list-item>
              <s-list-item>
                Importing copyrighted or trademarked products without authorization is strictly prohibited.
              </s-list-item>
              <s-list-item>
                You are solely responsible for ensuring compliance with Shopify's Acceptable Use Policy and all applicable laws.
              </s-list-item>
              <s-list-item>
                Amazon's Terms of Service must be respected. This includes proper use of product data and images.
              </s-list-item>
              <s-list-item>
                When using Affiliate Mode, you must comply with Amazon's Associates Program Operating Agreement.
              </s-list-item>
              <s-list-item>
                Any misuse of this app may result in account suspension or legal action.
              </s-list-item>
              <s-list-item>
                Price accuracy is your responsibility. Always verify prices before publishing products.
              </s-list-item>
            </s-unordered-list>

            <s-paragraph weight="semibold">
              By clicking "I Accept", you acknowledge that you have read and understood these terms.
            </s-paragraph>

            <s-stack direction="inline" gap="base" style={{ justifyContent: "flex-end", marginTop: "20px" }}>
              <s-button onClick={() => setShowTermsModal(false)}>
                Cancel
              </s-button>
              <s-button
                variant="primary"
                onClick={() => {
                  const formData = new FormData();
                  formData.append("action", "acceptTerms");
                  fetcher.submit(formData, { method: "POST" });
                }}
              >
                I Accept
              </s-button>
            </s-stack>
          </s-stack>
        </s-modal>
      )}

      <s-page heading="Import Amazon Products">
        <s-button slot="primary-action" href="/app/history">
          📊 View History
        </s-button>
        <s-button slot="secondary-action" href="/app/settings">
          ⚙️ Settings
        </s-button>

        {/* Step 1: Enter URL */}
        <s-section heading="Step 1: Enter Amazon Product URL">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Amazon Product URL"
              value={amazonUrl}
              onChange={(e: any) => setAmazonUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/B08N5WRWNW"
              helptext="Paste the full Amazon product URL (supports 12+ countries)"
            ></s-text-field>

            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                onClick={handleScrape}
                {...(isFetching ? { loading: true } : {})}
              >
                {isFetching ? "Fetching..." : "🔍 Fetch Product Data"}
              </s-button>

              {!settings.termsAccepted && (
                <s-button onClick={() => setShowTermsModal(true)}>
                  📜 View Terms
                </s-button>
              )}
            </s-stack>

          </s-stack>
        </s-section>

        {/* Loading State */}
        {isFetching && (
          <s-section heading="Loading product...">
            <s-stack direction="block" gap="base">
              <s-skeleton-text lines={1} />
              <s-stack direction="inline" gap="base">
                <s-box
                  style={{
                    width: "120px",
                    height: "120px",
                    backgroundColor: "#f4f6f8",
                    borderRadius: "8px",
                  }}
                />
                <s-box
                  style={{
                    width: "120px",
                    height: "120px",
                    backgroundColor: "#f4f6f8",
                    borderRadius: "8px",
                  }}
                />
                <s-box
                  style={{
                    width: "120px",
                    height: "120px",
                    backgroundColor: "#f4f6f8",
                    borderRadius: "8px",
                  }}
                />
              </s-stack>
              <s-skeleton-text lines={4} />
            </s-stack>
          </s-section>
        )}

        {/* Product Preview */}
        {showPreview && productData && !isFetching && (
          <>
            {/* Step 2: Product Preview */}
            <s-section heading="Step 2: Review Product Details">
              <s-stack direction="block" gap="base">
                <s-stack direction="inline" gap="base" align="start">
                  {productData.images && productData.images.length > 0 && (
                    <img
                      src={productData.images[0]}
                      alt={productData.title}
                      style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e1e3e5" }}
                    />
                  )}

                  <s-stack direction="block" gap="small" style={{ flex: 1 }}>
                    <s-heading size="medium">{productData.title}</s-heading>

                    <s-stack direction="inline" gap="small">
                      <s-badge tone="info">
                        Original: ${productData.originalPrice?.toFixed(2)}
                      </s-badge>
                      {productData.variants && productData.variants.length > 1 && (
                        <s-badge tone="success">{productData.variants.length} variants</s-badge>
                      )}
                      {productData.isPrime && <s-badge tone="info">Prime</s-badge>}
                      {productData.isAmazonChoice && <s-badge tone="warning">Amazon's Choice</s-badge>}
                    </s-stack>

                    {productData.rating && (
                      <s-text size="small" tone="subdued">
                        ⭐ {productData.rating}/5 ({productData.ratingsTotal?.toLocaleString()} reviews)
                      </s-text>
                    )}
                  </s-stack>
                </s-stack>

                {productData.bulletPoints && productData.bulletPoints.length > 0 && (
                  <s-stack direction="block" gap="small">
                    <s-text weight="semibold">Key Features:</s-text>
                    <s-unordered-list>
                      {productData.bulletPoints.slice(0, 5).map((point: string, idx: number) => (
                        <s-list-item key={idx}>{point}</s-list-item>
                      ))}
                    </s-unordered-list>
                  </s-stack>
                )}

                {productData.images && productData.images.length > 1 && (
                  <s-stack direction="inline" gap="small">
                    {productData.images.slice(0, 6).map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Product ${idx + 1}`}
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e1e3e5" }}
                      />
                    ))}
                  </s-stack>
                )}
              </s-stack>
            </s-section>

            {/* Step 3: Import Mode */}
            <s-section heading="Step 3: Choose Import Mode">
              <s-stack direction="block" gap="base">
                {/* Affiliate Mode */}
                <s-box
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                  style={{
                    borderColor: importMode === "AFFILIATE" ? "#008060" : "#e1e3e5",
                    backgroundColor: importMode === "AFFILIATE" ? "#f6f6f7" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setImportMode("AFFILIATE")}
                >
                  <s-stack direction="block" gap="small">
                    <s-stack direction="inline" gap="small">
                      <input
                        type="radio"
                        name="import-mode"
                        value="AFFILIATE"
                        checked={importMode === "AFFILIATE"}
                        onChange={() => setImportMode("AFFILIATE")}
                        style={{ marginTop: "4px" }}
                      />
                      <s-text weight="semibold" size="large">🟢 Affiliate Mode</s-text>
                    </s-stack>

                    <s-paragraph tone="subdued" size="small">
                      Keep original Amazon price. Add "Buy on Amazon" button to product page. Earn commissions through your affiliate ID.
                    </s-paragraph>

                    {importMode === "AFFILIATE" && (
                      <s-banner tone="info">
                        <s-stack direction="block" gap="small">
                          <s-text><strong>Final Price:</strong> ${productData.originalPrice?.toFixed(2)} (no markup)</s-text>
                          <s-text>A "{settings.buttonText}" button will be added after the "Buy It Now" button on your product page.</s-text>
                        </s-stack>
                      </s-banner>
                    )}
                  </s-stack>
                </s-box>

                {/* Dropshipping Mode */}
                <s-box
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                  style={{
                    borderColor: importMode === "DROPSHIPPING" ? "#008060" : "#e1e3e5",
                    backgroundColor: importMode === "DROPSHIPPING" ? "#f6f6f7" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setImportMode("DROPSHIPPING")}
                >
                  <s-stack direction="block" gap="base">
                    <s-stack direction="inline" gap="small">
                      <input
                        type="radio"
                        name="import-mode"
                        value="DROPSHIPPING"
                        checked={importMode === "DROPSHIPPING"}
                        onChange={() => setImportMode("DROPSHIPPING")}
                        style={{ marginTop: "4px" }}
                      />
                      <s-text weight="semibold" size="large">🛒 Dropshipping Mode</s-text>
                    </s-stack>

                    <s-paragraph tone="subdued" size="small">
                      Sell at your own price. No Amazon button. Perfect for traditional dropshipping.
                    </s-paragraph>

                    {importMode === "DROPSHIPPING" && (
                      <s-stack direction="block" gap="base">
                        <s-text weight="semibold">Price Markup Configuration:</s-text>

                        <s-stack direction="inline" gap="base">
                          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="radio"
                              name="markup-type"
                              value="FIXED"
                              checked={markupType === "FIXED"}
                              onChange={() => setMarkupType("FIXED")}
                            />
                            <s-text>Fixed Amount ($)</s-text>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="radio"
                              name="markup-type"
                              value="MULTIPLIER"
                              checked={markupType === "MULTIPLIER"}
                              onChange={() => setMarkupType("MULTIPLIER")}
                            />
                            <s-text>Multiplier (x)</s-text>
                          </label>
                        </s-stack>

                        <s-text-field
                          type="number"
                          value={markupValue.toString()}
                          onChange={(e: any) => setMarkupValue(parseFloat(e.target.value) || 0)}
                          label={markupType === "FIXED" ? "Markup Amount ($)" : "Price Multiplier"}
                          helptext={
                            markupType === "FIXED"
                              ? "Fixed amount to add to the original price"
                              : "Multiply original price (1.0 = no markup, 1.5 = 50% markup, 2.0 = 100% markup)"
                          }
                          min="0"
                          step={markupType === "FIXED" ? "0.01" : "0.1"}
                        ></s-text-field>

                        <s-banner tone="success">
                          <s-stack direction="block" gap="small">
                            <s-text><strong>Original Price:</strong> ${productData.originalPrice?.toFixed(2)}</s-text>
                            <s-text>
                              <strong>Markup:</strong>{" "}
                              {markupType === "FIXED" ? `$${markupValue.toFixed(2)}` : `${markupValue}x`}
                            </s-text>
                            <s-text size="large" weight="semibold">
                              <strong>Final Price:</strong> ${finalPrice.toFixed(2)}
                            </s-text>
                            <s-text tone="subdued" size="small">
                              Profit margin: ${(finalPrice - productData.originalPrice).toFixed(2)} (
                              {((finalPrice - productData.originalPrice) / productData.originalPrice * 100).toFixed(1)}%)
                            </s-text>
                          </s-stack>
                        </s-banner>
                      </s-stack>
                    )}
                  </s-stack>
                </s-box>
              </s-stack>
            </s-section>

            {/* Step 4: Publish Settings */}
            <s-section heading="Step 4: Publish Settings">
              <s-stack direction="block" gap="base">
                <s-select
                  label="Product Status"
                  value={productStatus}
                  onChange={(e: any) => setProductStatus(e.target.value)}
                >
                  <option value="DRAFT">💾 Draft (not visible to customers)</option>
                  <option value="ACTIVE">✅ Active (publish immediately)</option>
                </s-select>

                <s-select
                  label="Add to Collection (optional)"
                  value={selectedCollection}
                  onChange={(e: any) => setSelectedCollection(e.target.value)}
                >
                  <option value="">-- No Collection --</option>
                  {collections.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </s-select>

                <s-stack direction="inline" gap="base" style={{ justifyContent: "flex-end" }}>
                  <s-button onClick={() => setShowPreview(false)}>
                    Cancel
                  </s-button>
                  <s-button
                    variant="primary"
                    onClick={handleImport}
                    {...(isLoading && !isFetching ? { loading: true } : {})}
                  >
                    {productStatus === "ACTIVE" ? "✅ Publish to Store" : "💾 Save as Draft"}
                  </s-button>
                </s-stack>
              </s-stack>
            </s-section>
          </>
        )}

        {/* How it Works Sidebar */}
        <s-section slot="aside" heading="📖 How it Works">
          <s-ordered-list>
            <s-list-item>Accept the Terms of Importation</s-list-item>
            <s-list-item>Paste Amazon product URL</s-list-item>
            <s-list-item>Choose Affiliate or Dropshipping mode</s-list-item>
            <s-list-item>Configure pricing (if Dropshipping)</s-list-item>
            <s-list-item>Review and publish to your store</s-list-item>
          </s-ordered-list>
        </s-section>

        {/* Features Sidebar */}
        <s-section slot="aside" heading="✨ Features">
          <s-unordered-list>
            <s-list-item>12+ Amazon marketplaces supported</s-list-item>
            <s-list-item>Up to 250 variants per product</s-list-item>
            <s-list-item>Automatic image-to-variant linking</s-list-item>
            <s-list-item>Flexible pricing options</s-list-item>
            <s-list-item>Complete import history tracking</s-list-item>
            <s-list-item>Affiliate & Dropshipping modes</s-list-item>
          </s-unordered-list>
        </s-section>

        {/* Quick Tips */}
        <s-section slot="aside" heading="💡 Quick Tips">
          <s-stack direction="block" gap="small">
            <s-paragraph size="small">
              <strong>Affiliate Mode:</strong> Best for driving traffic to Amazon and earning commissions (1-10%).
            </s-paragraph>
            <s-paragraph size="small">
              <strong>Dropshipping Mode:</strong> Best for direct sales with your own pricing and margins.
            </s-paragraph>
            <s-paragraph size="small">
              <strong>Test in Draft:</strong> Always review products before publishing to customers.
            </s-paragraph>
          </s-stack>
        </s-section>
      </s-page>
    </>
  );
}

export const headers = boundary.headers;
