/**
 * Amazon Importer - Import History Page
 * Professional redesign with pagination, advanced filters, and bulk actions
 */

import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";
import StatCard from "~/components/StatCard";
import ProductCardList from "~/components/ProductCardList";
import EmptyState from "~/components/EmptyState";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const productsRaw = await prisma.importedProduct.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
  });

  const totalCount = await prisma.importedProduct.count({
    where: { shop: session.shop },
  });

  // Convert Date to string for client-side compatibility
  const products = productsRaw.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  // Calculate total value first
  const allProducts = await prisma.importedProduct.findMany({
    where: { shop: session.shop },
  });
  const totalValue = allProducts.reduce((sum, p) => sum + p.price, 0);

  // Calculate statistics
  const stats = {
    total: totalCount,
    affiliate: await prisma.importedProduct.count({
      where: { shop: session.shop, importMode: "AFFILIATE" },
    }),
    dropshipping: await prisma.importedProduct.count({
      where: { shop: session.shop, importMode: "DROPSHIPPING" },
    }),
    active: await prisma.importedProduct.count({
      where: { shop: session.shop, status: "ACTIVE" },
    }),
    draft: await prisma.importedProduct.count({
      where: { shop: session.shop, status: "DRAFT" },
    }),
    totalValue: totalValue,
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return { products, stats, shop: session.shop, currentPage: page, totalPages, totalCount };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "switchMode") {
    const productIds = JSON.parse(formData.get("productIds") as string);
    const newMode = formData.get("newMode") as "AFFILIATE" | "DROPSHIPPING";

    await prisma.importedProduct.updateMany({
      where: {
        id: { in: productIds },
        shop: session.shop,
      },
      data: {
        importMode: newMode,
      },
    });

    return { success: true, message: `${productIds.length} product(s) switched to ${newMode} mode` };
  }

  if (actionType === "delete") {
    const productIds = JSON.parse(formData.get("productIds") as string);

    await prisma.importedProduct.deleteMany({
      where: {
        id: { in: productIds },
        shop: session.shop,
      },
    });

    return { success: true, message: `${productIds.length} product(s) deleted` };
  }

  return { error: "Invalid action" };
};

export default function History() {
  const { products, stats, shop, currentPage, totalPages, totalCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show(fetcher.data.message);
      setSelectedProducts([]);
      // Refresh page
      window.location.reload();
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

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

  const activeFilters =
    (searchTerm ? 1 : 0) +
    (filterMode !== "ALL" ? 1 : 0) +
    (filterStatus !== "ALL" ? 1 : 0);

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterMode("ALL");
    setFilterStatus("ALL");
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkSwitch = (newMode: "AFFILIATE" | "DROPSHIPPING") => {
    if (selectedProducts.length === 0) {
      shopify.toast.show("Please select products first", { isError: true });
      return;
    }

    const formData = new FormData();
    formData.append("action", "switchMode");
    formData.append("productIds", JSON.stringify(selectedProducts));
    formData.append("newMode", newMode);
    fetcher.submit(formData, { method: "POST" });
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      shopify.toast.show("Please select products first", { isError: true });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      return;
    }

    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("productIds", JSON.stringify(selectedProducts));
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="📊 Import History">
      <s-button slot="primary-action" href="/app" variant="primary">
        + Import New Product
      </s-button>

      {/* Dashboard Stats */}
      {products.length > 0 && (
        <s-section heading="📈 Dashboard Statistics">
          <div style={{ display: "flex", gap: "16px", overflowX: "auto", flexWrap: "nowrap" }}>
            <StatCard
              icon="📦"
              value={stats.total}
              label="Total Products"
              colorVariant="blue"
              delay={0}
            />
            <StatCard
              icon="🟢"
              value={stats.affiliate}
              label="Affiliate Mode"
              colorVariant="green"
              delay={100}
              trend={
                stats.total > 0
                  ? {
                      value: `${((stats.affiliate / stats.total) * 100).toFixed(1)}% of total`,
                      isPositive: true,
                    }
                  : undefined
              }
            />
            <StatCard
              icon="🛒"
              value={stats.dropshipping}
              label="Dropshipping Mode"
              colorVariant="blue"
              delay={200}
              trend={
                stats.total > 0
                  ? {
                      value: `${((stats.dropshipping / stats.total) * 100).toFixed(1)}% of total`,
                      isPositive: true,
                    }
                  : undefined
              }
            />
            <StatCard
              icon="✅"
              value={stats.active}
              label="Active Products"
              colorVariant="yellow"
              delay={300}
              trend={{
                value: `${stats.draft} in draft`,
                isPositive: stats.active > stats.draft,
              }}
            />
            <StatCard
              icon="💰"
              value={`$${(stats.totalValue || 0).toFixed(0)}`}
              label="Total Catalog Value"
              colorVariant="purple"
              delay={400}
            />
          </div>
        </s-section>
      )}

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <s-section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "12px",
              color: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <s-text style={{ color: "white", fontWeight: "600" }}>
                {selectedProducts.length} product(s) selected
              </s-text>
              <button
                onClick={() => setSelectedProducts([])}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Clear
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleBulkSwitch("AFFILIATE")}
                style={{
                  background: "#10b981",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 16px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🟢 Switch to Affiliate
              </button>
              <button
                onClick={() => handleBulkSwitch("DROPSHIPPING")}
                style={{
                  background: "#3b82f6",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 16px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🛒 Switch to Dropshipping
              </button>
              <button
                onClick={handleBulkDelete}
                style={{
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 16px",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </s-section>
      )}

      {/* Filters Bar */}
      <s-section heading="🔍 Search & Filter">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Select All Checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "140px" }}>
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
              onChange={selectAll}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label htmlFor="selectAll" style={{ cursor: "pointer", fontWeight: "600" }}>
              Select All
            </label>
          </div>

          {/* Search Input */}
          <s-text-field
            label="Search Products"
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search by title or ASIN..."
            style={{ minWidth: "300px", flex: "1 1 300px" }}
          />

          {/* Import Mode Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
              Import Mode
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
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
              <option value="ALL">🔄 All Modes</option>
              <option value="AFFILIATE">🟢 Affiliate Only</option>
              <option value="DROPSHIPPING">🛒 Dropshipping Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
              <option value="ALL">📋 All Status</option>
              <option value="ACTIVE">✅ Active Only</option>
              <option value="DRAFT">📝 Draft Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "200px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
              <option value="newest">📅 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="price-high">💵 Price: High to Low</option>
              <option value="price-low">💵 Price: Low to High</option>
              <option value="name-asc">🔤 Name: A to Z</option>
              <option value="name-desc">🔤 Name: Z to A</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {activeFilters > 0 && (
            <s-button onClick={clearAllFilters}>
              Clear All ({activeFilters})
            </s-button>
          )}
        </div>

        {/* Active Filters Summary */}
        {activeFilters > 0 && (
          <s-banner tone="info" style={{ marginTop: "16px" }}>
            <s-stack direction="inline" gap="small" style={{ flexWrap: "wrap", alignItems: "center" }}>
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
            </s-stack>
          </s-banner>
        )}
      </s-section>

      {/* Products Grid */}
      <s-section
        heading={`📦 Products (${filteredProducts.length})`}
      >
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={products.length === 0 ? "📦" : "🔍"}
            title={
              products.length === 0
                ? "No Products Yet"
                : "No Products Found"
            }
            description={
              products.length === 0
                ? "Start by importing your first product from Amazon! It only takes a few clicks."
                : "Try adjusting your search and filter criteria to find what you're looking for."
            }
            actionLabel={products.length === 0 ? "Import Your First Product" : undefined}
            onAction={products.length === 0 ? () => window.location.href = "/app" : undefined}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            {filteredProducts.map((product) => (
              <div key={product.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleSelectProduct(product.id)}
                  style={{ width: "20px", height: "20px", cursor: "pointer", flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <ProductCardList product={product} shop={shop} />
                </div>
              </div>
            ))}
          </div>
        )}
      </s-section>

      {/* Pagination */}
      {totalPages > 1 && (
        <s-section>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
            <s-button
              disabled={currentPage === 1}
              onClick={() => window.location.href = `/app/history?page=${currentPage - 1}`}
            >
              ← Previous
            </s-button>

            <s-text weight="medium">
              Page {currentPage} of {totalPages} ({totalCount} products)
            </s-text>

            <s-button
              disabled={currentPage === totalPages}
              onClick={() => window.location.href = `/app/history?page=${currentPage + 1}`}
            >
              Next →
            </s-button>
          </div>
        </s-section>
      )}

      {/* Pagination Info */}
      {filteredProducts.length > 0 && (
        <s-section>
          <s-banner tone="info">
            <s-text>
              Showing {filteredProducts.length} of {products.length} products on this page
              {activeFilters > 0 ? " (filtered)" : ""}
            </s-text>
          </s-banner>
        </s-section>
      )}
    </s-page>
  );
}

export const headers = boundary.headers;
