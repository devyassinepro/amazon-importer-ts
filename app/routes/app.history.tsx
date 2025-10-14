import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const products = await prisma.importedProduct.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  // Calculate statistics
  const stats = {
    total: products.length,
    affiliate: products.filter((p) => p.importMode === "AFFILIATE").length,
    dropshipping: products.filter((p) => p.importMode === "DROPSHIPPING").length,
    active: products.filter((p) => p.status === "ACTIVE").length,
    draft: products.filter((p) => p.status === "DRAFT").length,
    totalValue: products.reduce((sum, p) => sum + p.price, 0),
  };

  return { products, stats };
};

export default function History() {
  const { products, stats } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filter and sort products
  let filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.amazonAsin?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode =
      filterMode === "ALL" || product.importMode === filterMode;

    const matchesStatus =
      filterStatus === "ALL" || product.status === filterStatus;

    return matchesSearch && matchesMode && matchesStatus;
  });

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      case "name-asc":
        return a.title.localeCompare(b.title);
      case "name-desc":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return (
    <s-page heading="📊 Import History">
      <s-button slot="primary-action" href="/app" variant="primary">
        + Import New Product
      </s-button>

      <s-stack direction="block" gap="base">
        {/* Header Banner */}
        {products.length > 0 && (
          <s-banner tone="info">
            <s-paragraph>
              You have imported <strong>{stats.total}</strong> product{stats.total !== 1 ? "s" : ""} with a total value of{" "}
              <strong>${stats.totalValue.toFixed(2)}</strong>
            </s-paragraph>
          </s-banner>
        )}

        {/* Statistics Cards */}
        <s-section>
          <s-box padding="none">
            <s-text variant="headingMd" weight="semibold" style={{ marginBottom: "16px" }}>
              📈 Overview Statistics
            </s-text>
            <s-stack direction="inline" gap="base" style={{ flexWrap: "wrap" }}>
              {/* Total Products */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                style={{
                  backgroundColor: "#f9fafb",
                  minWidth: "180px",
                  flex: "1 1 180px",
                }}
              >
                <s-stack direction="block" gap="tight">
                  <s-text tone="subdued" size="small" weight="medium">
                    📦 Total Products
                  </s-text>
                  <s-text variant="headingLg" weight="bold" style={{ fontSize: "32px" }}>
                    {stats.total}
                  </s-text>
                  <s-text tone="subdued" size="small">
                    All imported items
                  </s-text>
                </s-stack>
              </s-box>

              {/* Affiliate */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                style={{
                  backgroundColor: "#f0fdf4",
                  borderColor: "#86efac",
                  minWidth: "180px",
                  flex: "1 1 180px",
                }}
              >
                <s-stack direction="block" gap="tight">
                  <s-text size="small" weight="medium" style={{ color: "#166534" }}>
                    🟢 Affiliate
                  </s-text>
                  <s-text variant="headingLg" weight="bold" style={{ fontSize: "32px", color: "#166534" }}>
                    {stats.affiliate}
                  </s-text>
                  <s-text size="small" style={{ color: "#166534" }}>
                    {stats.total > 0 ? ((stats.affiliate / stats.total) * 100).toFixed(1) : 0}% of total
                  </s-text>
                </s-stack>
              </s-box>

              {/* Dropshipping */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                style={{
                  backgroundColor: "#eff6ff",
                  borderColor: "#93c5fd",
                  minWidth: "180px",
                  flex: "1 1 180px",
                }}
              >
                <s-stack direction="block" gap="tight">
                  <s-text size="small" weight="medium" style={{ color: "#1e40af" }}>
                    🛒 Dropshipping
                  </s-text>
                  <s-text variant="headingLg" weight="bold" style={{ fontSize: "32px", color: "#1e40af" }}>
                    {stats.dropshipping}
                  </s-text>
                  <s-text size="small" style={{ color: "#1e40af" }}>
                    {stats.total > 0 ? ((stats.dropshipping / stats.total) * 100).toFixed(1) : 0}% of total
                  </s-text>
                </s-stack>
              </s-box>

              {/* Active Products */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                style={{
                  backgroundColor: "#fef3c7",
                  borderColor: "#fbbf24",
                  minWidth: "180px",
                  flex: "1 1 180px",
                }}
              >
                <s-stack direction="block" gap="tight">
                  <s-text size="small" weight="medium" style={{ color: "#92400e" }}>
                    ✅ Active
                  </s-text>
                  <s-text variant="headingLg" weight="bold" style={{ fontSize: "32px", color: "#92400e" }}>
                    {stats.active}
                  </s-text>
                  <s-text size="small" style={{ color: "#92400e" }}>
                    {stats.draft} in draft
                  </s-text>
                </s-stack>
              </s-box>

              {/* Total Value */}
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                style={{
                  backgroundColor: "#f5f3ff",
                  borderColor: "#c4b5fd",
                  minWidth: "180px",
                  flex: "1 1 180px",
                }}
              >
                <s-stack direction="block" gap="tight">
                  <s-text size="small" weight="medium" style={{ color: "#5b21b6" }}>
                    💰 Total Value
                  </s-text>
                  <s-text variant="headingLg" weight="bold" style={{ fontSize: "32px", color: "#5b21b6" }}>
                    ${stats.totalValue.toFixed(0)}
                  </s-text>
                  <s-text size="small" style={{ color: "#5b21b6" }}>
                    Combined catalog value
                  </s-text>
                </s-stack>
              </s-box>
            </s-stack>
          </s-box>
        </s-section>

        {/* Filters & Search */}
        <s-section>
          <s-box padding="base" borderWidth="base" borderRadius="base" style={{ backgroundColor: "#f9fafb" }}>
            <s-stack direction="block" gap="base">
              <s-text variant="headingMd" weight="semibold">
                🔍 Search & Filter
              </s-text>

              <s-stack direction="inline" gap="base" style={{ flexWrap: "wrap" }}>
                {/* Search */}
                <s-text-field
                  label="Search Products"
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or ASIN..."
                  style={{ minWidth: "300px", flex: "1 1 300px" }}
                ></s-text-field>

                {/* Import Mode Filter */}
                <s-select
                  label="Import Mode"
                  value={filterMode}
                  onChange={(e: any) => setFilterMode(e.target.value)}
                  style={{ minWidth: "180px" }}
                >
                  <option value="ALL">🔄 All Modes</option>
                  <option value="AFFILIATE">🟢 Affiliate Only</option>
                  <option value="DROPSHIPPING">🛒 Dropshipping Only</option>
                </s-select>

                {/* Status Filter */}
                <s-select
                  label="Status"
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
                  style={{ minWidth: "180px" }}
                >
                  <option value="ALL">📋 All Status</option>
                  <option value="ACTIVE">✅ Active Only</option>
                  <option value="DRAFT">📝 Draft Only</option>
                </s-select>

                {/* Sort By */}
                <s-select
                  label="Sort By"
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  style={{ minWidth: "200px" }}
                >
                  <option value="newest">📅 Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="price-high">💵 Price: High to Low</option>
                  <option value="price-low">💵 Price: Low to High</option>
                  <option value="name-asc">🔤 Name: A to Z</option>
                  <option value="name-desc">🔤 Name: Z to A</option>
                </s-select>
              </s-stack>

              {/* Active Filters Summary */}
              {(searchTerm || filterMode !== "ALL" || filterStatus !== "ALL") && (
                <s-banner tone="info">
                  <s-stack direction="inline" gap="tight" style={{ flexWrap: "wrap", alignItems: "center" }}>
                    <s-text weight="medium">Active filters:</s-text>
                    {searchTerm && (
                      <s-badge>
                        Search: "{searchTerm}"
                      </s-badge>
                    )}
                    {filterMode !== "ALL" && (
                      <s-badge tone="success">
                        Mode: {filterMode}
                      </s-badge>
                    )}
                    {filterStatus !== "ALL" && (
                      <s-badge tone="warning">
                        Status: {filterStatus}
                      </s-badge>
                    )}
                    <s-button
                      variant="plain"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterMode("ALL");
                        setFilterStatus("ALL");
                      }}
                    >
                      Clear all
                    </s-button>
                  </s-stack>
                </s-banner>
              )}
            </s-stack>
          </s-box>
        </s-section>

        {/* Products List */}
        <s-section>
          <s-text variant="headingMd" weight="semibold" style={{ marginBottom: "16px" }}>
            📦 Products ({filteredProducts.length})
          </s-text>
          {filteredProducts.length === 0 ? (
            <s-box padding="base" borderWidth="base" borderRadius="base" style={{ textAlign: "center", backgroundColor: "#f9fafb" }}>
              <s-stack direction="block" gap="base" style={{ alignItems: "center" }}>
                <s-text variant="headingLg">
                  {products.length === 0 ? "📦" : "🔍"}
                </s-text>
                <s-text variant="headingMd" weight="semibold">
                  {products.length === 0 ? "No Products Yet" : "No Products Found"}
                </s-text>
                <s-paragraph>
                  {products.length === 0
                    ? "Start by importing your first product from Amazon!"
                    : "Try adjusting your search and filter criteria."}
                </s-paragraph>
                {products.length === 0 && (
                  <s-button variant="primary" href="/app">
                    Import Your First Product
                  </s-button>
                )}
              </s-stack>
            </s-box>
          ) : (
            <s-stack direction="block" gap="base">
              {filteredProducts.map((product) => {
                const profitAmount = product.price - product.originalPrice;
                const profitPercentage = product.originalPrice > 0
                  ? ((profitAmount / product.originalPrice) * 100).toFixed(1)
                  : "0";

                return (
                  <s-box
                    key={product.id}
                    padding="base"
                    borderWidth="base"
                    borderRadius="base"
                    style={{
                      backgroundColor: "white",
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    <s-stack direction="inline" gap="base" align="start">
                      {/* Product Image */}
                      {product.productImage && (
                        <s-box
                          style={{
                            position: "relative",
                            minWidth: "120px",
                            width: "120px",
                            height: "120px",
                          }}
                        >
                          <img
                            src={product.productImage}
                            alt={product.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid #e1e3e5",
                            }}
                          />
                          {/* Mode Badge Overlay */}
                          <s-box
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              backgroundColor: product.importMode === "AFFILIATE" ? "#10b981" : "#3b82f6",
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            {product.importMode === "AFFILIATE" ? "🟢" : "🛒"}
                          </s-box>
                        </s-box>
                      )}

                      {/* Product Info */}
                      <s-stack direction="block" gap="base" style={{ flex: 1 }}>
                        {/* Title and Status */}
                        <s-stack direction="block" gap="tight">
                          <s-text variant="headingMd" weight="semibold">
                            {product.title}
                          </s-text>

                          <s-stack direction="inline" gap="tight" style={{ flexWrap: "wrap" }}>
                            <s-badge
                              tone={product.importMode === "AFFILIATE" ? "success" : "info"}
                            >
                              {product.importMode === "AFFILIATE" ? "🟢 Affiliate" : "🛒 Dropshipping"}
                            </s-badge>

                            <s-badge
                              tone={product.status === "ACTIVE" ? "success" : "warning"}
                            >
                              {product.status === "ACTIVE" ? "✅ Active" : "📝 Draft"}
                            </s-badge>

                            {product.variantCount > 1 && (
                              <s-badge tone="info">{product.variantCount} variants</s-badge>
                            )}

                            {product.amazonAsin && (
                              <s-badge tone="subdued">ASIN: {product.amazonAsin}</s-badge>
                            )}
                          </s-stack>
                        </s-stack>

                        {/* Pricing Info */}
                        <s-stack direction="inline" gap="base" style={{ flexWrap: "wrap" }}>
                          <s-stack direction="block" gap="none">
                            <s-text size="small" tone="subdued">
                              Your Price
                            </s-text>
                            <s-text variant="headingMd" weight="bold" style={{ color: "#008060" }}>
                              ${product.price.toFixed(2)}
                            </s-text>
                          </s-stack>

                          {product.originalPrice !== product.price && (
                            <>
                              <s-stack direction="block" gap="none">
                                <s-text size="small" tone="subdued">
                                  Amazon Price
                                </s-text>
                                <s-text weight="medium">
                                  ${product.originalPrice.toFixed(2)}
                                </s-text>
                              </s-stack>

                              <s-stack direction="block" gap="none">
                                <s-text size="small" tone="subdued">
                                  Your Markup
                                </s-text>
                                <s-text weight="medium" style={{ color: profitAmount > 0 ? "#16a34a" : "#dc2626" }}>
                                  +${profitAmount.toFixed(2)} ({profitPercentage}%)
                                </s-text>
                              </s-stack>
                            </>
                          )}

                          <s-stack direction="block" gap="none">
                            <s-text size="small" tone="subdued">
                              Imported On
                            </s-text>
                            <s-text weight="medium">
                              {new Date(product.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </s-text>
                          </s-stack>
                        </s-stack>

                        {/* Action Links */}
                        <s-divider />
                        <s-stack direction="inline" gap="base">
                          <s-button
                            variant="plain"
                            onClick={() => {
                              window.open(
                                `shopify://admin/products/${product.shopifyProductId.replace("gid://shopify/Product/", "")}`,
                                "_blank"
                              );
                            }}
                          >
                            🛍️ View in Shopify
                          </s-button>
                          <s-button
                            variant="plain"
                            onClick={() => {
                              window.open(product.amazonUrl, "_blank");
                            }}
                          >
                            🔗 View on Amazon
                          </s-button>
                          {product.shopifyHandle && (
                            <s-text size="small" tone="subdued">
                              Handle: <strong>{product.shopifyHandle}</strong>
                            </s-text>
                          )}
                        </s-stack>
                      </s-stack>
                    </s-stack>
                  </s-box>
                );
              })}
            </s-stack>
          )}
        </s-section>
      </s-stack>
    </s-page>
  );
}

export const headers = boundary.headers;
