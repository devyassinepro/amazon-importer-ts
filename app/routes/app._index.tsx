/**
 * Amazon Importer - Main Import Page
 * NO MODALS VERSION - Uses inline sections for better compatibility
 */

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
import TermsBlocker from "~/components/TermsBlocker";
import ModeSelector from "~/components/ModeSelector";
import PricingCalculator from "~/components/PricingCalculator";
import LoadingState from "~/components/LoadingState";
import ProductCardList from "~/components/ProductCardList";
import YouTubeModal from "~/components/YouTubeModal";

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

  const recentProducts = await prisma.importedProduct.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { settings, collections, recentProducts };
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

    // Recalculate price with user-selected markup
    const originalPrice = (productData as any).originalPrice || productData.price;
    if (importMode === "DROPSHIPPING") {
      const finalPrice = applyPricingMarkup(originalPrice, markupType, markupValue);
      productData.price = finalPrice;
    } else {
      // Affiliate mode: keep original price
      productData.price = originalPrice;
    }

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
  const { settings, collections, recentProducts } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [showTermsBlocker, setShowTermsBlocker] = useState(!settings.termsAccepted);
  const [showVideoModal, setShowVideoModal] = useState(false);
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
  const [productStatus, setProductStatus] = useState<"DRAFT" | "ACTIVE">(
    settings.autoPublish ? "ACTIVE" : "DRAFT"
  );
  const [selectedCollection, setSelectedCollection] = useState(
    settings.defaultCollectionId || ""
  );

  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
  const isFetching = isLoading && fetcher.formData?.get("action") === "scrape";

  useEffect(() => {
    if (fetcher.data?.action === "termsAccepted") {
      setShowTermsBlocker(false);
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

  const handleFetchProduct = () => {
    if (!amazonUrl.trim()) {
      shopify.toast.show("Please enter an Amazon URL", { isError: true });
      return;
    }
    if (!settings.termsAccepted) {
      shopify.toast.show("Please accept the terms first", { isError: true });
      setShowTermsBlocker(true);
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

  const handleAcceptTerms = () => {
    const formData = new FormData();
    formData.append("action", "acceptTerms");
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
      {/* Terms Blocker (replaces modal) */}
      <TermsBlocker
        show={showTermsBlocker}
        onAccept={handleAcceptTerms}
      />

      {/* YouTube Video Modal */}
      <YouTubeModal
        show={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoId="dQw4w9WgXcQ"
      />

      <s-page heading="📦 Import Amazon Products">
        <s-button slot="primary-action" href="/app/history">
          📊 View History
        </s-button>
        <s-button slot="secondary-action" href="/app/settings">
          ⚙️ Settings
        </s-button>

        {/* Header Section */}
        <s-section>
          <s-stack direction="block" gap="base">
            <s-text tone="subdued">
              Import products from Amazon to your Shopify store in Affiliate or Dropshipping mode.
              Configure pricing, add to collections, and publish instantly.
            </s-text>

            {/* Video Tutorial Button */}
            <div
              onClick={() => setShowVideoModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: "0 4px 6px -1px rgba(102, 126, 234, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(102, 126, 234, 0.3)";
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ▶️
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: "0 0 4px 0",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "600",
                  }}
                >
                  Watch Tutorial Video
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "14px",
                  }}
                >
                  Learn how to import products from Amazon in 5 minutes
                </p>
              </div>
            </div>
          </s-stack>
        </s-section>

                {/* Step 1: Enter URL */}
                <s-section heading="Step 1: Enter Amazon Product URL">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Amazon Product URL"
              value={amazonUrl}
              onChange={(e: any) => setAmazonUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/B08N5WRWNW"
              helptext="Paste the full Amazon product URL (supports 12+ countries)"
            />

            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                onClick={handleFetchProduct}
                {...(isFetching ? { loading: true } : {})}
              >
                {isFetching ? "Importing Product..." : "📦 Import Product"}
              </s-button>

              {!settings.termsAccepted && (
                <s-button onClick={() => setShowTermsBlocker(true)}>
                  📜 View Terms
                </s-button>
              )}
            </s-stack>
          </s-stack>
        </s-section>

        <s-divider />


        {/* Loading State */}
        {isFetching && (
          <s-section heading="Fetching product...">
            <LoadingState variant="product" count={3} />
          </s-section>
        )}

        {/* Product Preview */}
        {showPreview && productData && !isFetching && (
          <>
            {/* Step 2: Product Preview */}
            <s-section heading="Step 2: Review Product Details" className="animate-slide-up">
              <s-stack direction="block" gap="base">
                <s-stack direction="inline" gap="base" align="start">
                  {productData.images && productData.images.length > 0 && (
                    <img
                      src={productData.images[0]}
                      alt={productData.title}
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border-default)",
                      }}
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
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid var(--color-border-default)",
                        }}
                      />
                    ))}
                  </s-stack>
                )}
              </s-stack>
            </s-section>

            {/* Step 3: Import Mode */}
            <s-section heading="Step 3: Choose Import Mode">
              <ModeSelector
                selected={importMode}
                onChange={setImportMode}
                originalPrice={productData.originalPrice}
                buttonText={settings.buttonText}
              />

              {importMode === "DROPSHIPPING" && (
                <PricingCalculator
                  originalPrice={productData.originalPrice}
                  markupType={markupType}
                  markupValue={markupValue}
                  onMarkupTypeChange={setMarkupType}
                  onMarkupValueChange={setMarkupValue}
                />
              )}
            </s-section>

            {/* Step 4: Publish Settings */}
            <s-section heading="Step 4: Publish Settings">
              <s-stack direction="block" gap="base">
                {/* Product Status - Native Select */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="productStatus" style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                    Product Status
                  </label>
                  <select
                    id="productStatus"
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value as "DRAFT" | "ACTIVE")}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #c9cccf",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="DRAFT">📝 Draft</option>
                    <option value="ACTIVE">✅ Active</option>
                  </select>
                </div>

                {/* Collection Selector - Native Select */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="selectedCollection" style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
                    Add to Collection (optional)
                  </label>
                  <select
                    id="selectedCollection"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #c9cccf",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="">-- No Collection --</option>
                    {collections && collections.length > 0 ? (
                      collections.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))
                    ) : null}
                  </select>
                  <span style={{ fontSize: "13px", color: "#6d7175", marginTop: "4px" }}>
                    {!collections || collections.length === 0 ? (
                      <>
                        ⚠️ No collections found in your store.{" "}
                        <a
                          href={`https://${settings.shop}/admin/collections`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#008060", textDecoration: "underline" }}
                        >
                          Create one in Shopify admin
                        </a>{" "}
                        first.
                      </>
                    ) : (
                      `✅ ${collections.length} collection(s) available`
                    )}
                  </span>
                </div>

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

        {/* Recent Products */}
        {recentProducts && recentProducts.length > 0 && (
          <s-section heading="📦 Recently Imported Products">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              {recentProducts.slice(0, 5).map((product: any) => (
                <ProductCardList key={product.id} product={product} shop={settings.shop} />
              ))}
            </div>
            {recentProducts.length > 3 && (
              <s-stack direction="inline" gap="base" style={{ justifyContent: "center", marginTop: "24px" }}>
                <s-button href="/app/history">
                  View All Import History →
                </s-button>
              </s-stack>
            )}

          </s-section>
        )}
        {/* Sidebar */}
        <s-section slot="aside" heading="📖 How it Works">
          <s-ordered-list>
            <s-list-item>Accept the Terms of Importation</s-list-item>
            <s-list-item>Paste Amazon product URL</s-list-item>
            <s-list-item>Click "Import Product"</s-list-item>
            <s-list-item>Choose Affiliate or Dropshipping mode</s-list-item>
            <s-list-item>Configure pricing (if Dropshipping)</s-list-item>
            <s-list-item>Review and publish to your store</s-list-item>
          </s-ordered-list>
        </s-section>

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
