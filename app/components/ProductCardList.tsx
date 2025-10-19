/**
 * ProductCardList Component
 * Card pour affichage en liste (horizontal layout)
 * Tous les styles inline pour éviter les conflits d'hydratation
 */

interface ProductCardListProps {
  product: {
    id: string;
    title: string;
    productImage: string | null;
    price: number;
    originalPrice: number;
    importMode: string;
    status: string;
    variantCount: number;
    createdAt: string;
    shopifyProductId: string;
    amazonUrl: string;
  };
  shop: string;
}

export default function ProductCardList({ product, shop }: ProductCardListProps) {
  const profit = product.price - product.originalPrice;
  const profitMargin = ((profit / product.originalPrice) * 100).toFixed(1);

  const handleViewShopify = () => {
    const productId = product.shopifyProductId.split("/").pop();
    window.open(`https://${shop}/admin/products/${productId}`, "_blank");
  };

  const handleViewAmazon = () => {
    window.open(product.amazonUrl, "_blank");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        background: "#ffffff",
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Image Section */}
      <div
        style={{
          position: "relative",
          width: "180px",
          minWidth: "180px",
          height: "180px",
          background: "#f6f6f7",
          flexShrink: 0,
        }}
      >
        {product.productImage ? (
          <img
            src={product.productImage}
            alt={product.title}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              color: "#8c9196",
            }}
          >
            📦
          </div>
        )}

        {/* Mode Badge */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
              color: "white",
              background:
                product.importMode === "AFFILIATE"
                  ? "rgba(16, 185, 129, 0.9)"
                  : "rgba(59, 130, 246, 0.9)",
              backdropFilter: "blur(10px)",
            }}
          >
            {product.importMode === "AFFILIATE" ? "🟢 Affiliate" : "🛒 Dropship"}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Title */}
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#202223",
            margin: "0 0 12px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: "1.4",
          }}
        >
          {product.title}
        </h3>

        {/* Badges */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <s-badge tone={product.status === "ACTIVE" ? "success" : "info"}>
            {product.status === "ACTIVE" ? "✅ Published" : "💾 Draft"}
          </s-badge>
          {product.variantCount > 1 && (
            <s-badge>{product.variantCount} variants</s-badge>
          )}
        </div>

        {/* Price Info */}
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#008060",
              marginBottom: "4px",
            }}
          >
            ${product.price.toFixed(2)}
          </div>
          {product.importMode === "DROPSHIPPING" && profit > 0 && (
            <div
              style={{
                fontSize: "14px",
                color: "#10b981",
                marginTop: "4px",
              }}
            >
              Profit: ${profit.toFixed(2)} ({profitMargin}%)
            </div>
          )}
          <div
            style={{
              fontSize: "13px",
              color: "#6d7175",
              marginTop: "4px",
            }}
          >
            Original: ${product.originalPrice.toFixed(2)} •{" "}
            {new Date(product.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid #e1e3e5",
          }}
        >
          <s-button onClick={handleViewShopify} style={{ flex: 1 }}>
            View in Shopify
          </s-button>
          <s-button onClick={handleViewAmazon}>🔗</s-button>
        </div>
      </div>
    </div>
  );
}
