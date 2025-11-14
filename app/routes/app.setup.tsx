/**
 * Setup Instructions Page
 * Provides detailed instructions on how to install the Amazon Buy Button app block
 */

import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    shop: session.shop,
  };
};

export default function SetupPage() {
  const { shop } = useLoaderData<typeof loader>();
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate deep link to theme editor
  const themeEditorUrl = `https://${shop}/admin/themes/current/editor&template=product&activateAppId=fd2c0b3a-8f7e-e0d8-90a1-c35898eca7b1/amazon-button`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(themeEditorUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "12px", color: "#202223" }}>
          Setup Instructions
        </h1>
        <p style={{ fontSize: "14px", color: "#6d7175", lineHeight: "1.6" }}>
          Follow these steps to add the "Buy on Amazon" button to your product pages
        </p>
      </div>

      {/* Quick Start Button */}
      <div style={{
        backgroundColor: "#f6f6f7",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "30px",
        border: "1px solid #e1e3e5"
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px", color: "#202223" }}>
          🚀 Quick Start
        </h2>
        <p style={{ fontSize: "14px", color: "#6d7175", marginBottom: "16px", lineHeight: "1.6" }}>
          Click the button below to open your theme editor and automatically navigate to the app blocks section.
        </p>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href={themeEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#008060",
              color: "#ffffff",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              textAlign: "center",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#006e52"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#008060"}
          >
            Open Theme Editor
          </a>
          <button
            onClick={handleCopyLink}
            style={{
              padding: "12px 20px",
              backgroundColor: "#ffffff",
              color: "#202223",
              border: "1px solid #c9cccf",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f6f6f7"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
          >
            {copySuccess ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Step-by-Step Instructions */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px", color: "#202223" }}>
          📋 Step-by-Step Installation
        </h2>

        {/* Step 1 */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              minWidth: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#008060",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px"
            }}>
              1
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
                Navigate to Theme Editor
              </h3>
              <p style={{ fontSize: "14px", color: "#6d7175", marginBottom: "12px", lineHeight: "1.6" }}>
                Click the "Open Theme Editor" button above, or manually go to:
              </p>
              <ul style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
                <li>Go to <strong>Online Store → Themes</strong> in your Shopify admin</li>
                <li>Click <strong>Customize</strong> on your active theme</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              minWidth: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#008060",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px"
            }}>
              2
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
                Select a Product Template
              </h3>
              <p style={{ fontSize: "14px", color: "#6d7175", marginBottom: "12px", lineHeight: "1.6" }}>
                In the theme editor:
              </p>
              <ul style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
                <li>At the top of the page, select <strong>Products → Default product</strong></li>
                <li>Or choose any specific product to preview</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              minWidth: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#008060",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px"
            }}>
              3
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
                Add the App Block
              </h3>
              <p style={{ fontSize: "14px", color: "#6d7175", marginBottom: "12px", lineHeight: "1.6" }}>
                In the left sidebar:
              </p>
              <ul style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
                <li>Click <strong>"Add block"</strong> or <strong>"Add section"</strong></li>
                <li>Scroll to the <strong>"Apps"</strong> section</li>
                <li>Look for <strong>"Amazon Buy Button"</strong></li>
                <li>Click to add it to your product page</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              minWidth: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#008060",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px"
            }}>
              4
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
                Position the Button
              </h3>
              <p style={{ fontSize: "14px", color: "#6d7175", marginBottom: "12px", lineHeight: "1.6" }}>
                Drag the "Amazon Buy Button" block to your desired position. We recommend placing it:
              </p>
              <ul style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
                <li>Below the <strong>"Add to Cart"</strong> button</li>
                <li>In the product information section</li>
                <li>Above or below product description</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              minWidth: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#008060",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px"
            }}>
              5
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
                Customize the Button (Optional)
              </h3>
              <p style={{ fontSize: "14px", color: "#6d7175", marginBottom: "12px", lineHeight: "1.6" }}>
                Click on the block to customize:
              </p>
              <ul style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
                <li><strong>Button Text:</strong> Change the text (default: "Buy on Amazon")</li>
                <li><strong>Colors:</strong> Background, hover, text, and border colors</li>
                <li><strong>Styling:</strong> Font size, weight, border radius, padding</li>
                <li><strong>Spacing:</strong> Top and bottom margins</li>
                <li><strong>Disclaimer:</strong> Toggle affiliate disclosure text</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 6 */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid #e1e3e5"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{
              minWidth: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#008060",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px"
            }}>
              6
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
                Save Your Changes
              </h3>
              <p style={{ fontSize: "14px", color: "#6d7175", lineHeight: "1.6" }}>
                Click <strong>"Save"</strong> in the top-right corner of the theme editor to publish your changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div style={{
        backgroundColor: "#fff4e5",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "30px",
        border: "1px solid #ffd699"
      }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#996a13" }}>
          ⚠️ Important Notes
        </h2>
        <ul style={{ fontSize: "14px", color: "#996a13", marginLeft: "20px", lineHeight: "1.8" }}>
          <li>
            <strong>Automatic Display:</strong> The button only appears on products imported in <strong>AFFILIATE mode</strong>
          </li>
          <li>
            <strong>No Manual Setup Required:</strong> The button automatically links to the Amazon product URL
          </li>
          <li>
            <strong>Full-Inventory Products:</strong> Products imported with inventory do NOT show the Amazon button
          </li>
          <li>
            <strong>Theme Compatibility:</strong> Works with all Shopify themes that support app blocks
          </li>
        </ul>
      </div>

      {/* How It Works */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px", color: "#202223" }}>
          🔧 How It Works
        </h2>
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          border: "1px solid #e1e3e5"
        }}>
          <ol style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
            <li style={{ marginBottom: "12px" }}>
              When you import a product in <strong>AFFILIATE mode</strong>, we save the Amazon URL as a product metafield
            </li>
            <li style={{ marginBottom: "12px" }}>
              The Amazon Buy Button block checks if the product has this metafield
            </li>
            <li style={{ marginBottom: "12px" }}>
              If the metafield exists, the button is displayed with the Amazon link
            </li>
            <li>
              Customers click the button and are redirected to Amazon to complete their purchase
            </li>
          </ol>
        </div>
      </div>

      {/* Troubleshooting */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px", color: "#202223" }}>
          🔍 Troubleshooting
        </h2>

        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "12px",
          border: "1px solid #e1e3e5"
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
            Button Not Showing?
          </h3>
          <ul style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
            <li>Make sure the product was imported in <strong>AFFILIATE mode</strong></li>
            <li>Verify the block is added and visible in the theme editor</li>
            <li>Check if the block is placed in a visible section of the product page</li>
            <li>Try clearing your browser cache and reloading the page</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "20px",
          border: "1px solid #e1e3e5"
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
            Can't Find App Block?
          </h3>
          <ul style={{ fontSize: "14px", color: "#6d7175", marginLeft: "20px", lineHeight: "1.8" }}>
            <li>Make sure the app is installed and enabled</li>
            <li>Try refreshing the theme editor page</li>
            <li>Check if your theme supports app blocks (most modern themes do)</li>
            <li>Look under both "Blocks" and "Sections" in the theme editor</li>
          </ul>
        </div>
      </div>

      {/* Support */}
      {/* <div style={{
        backgroundColor: "#f6f6f7",
        borderRadius: "8px",
        padding: "20px",
        border: "1px solid #e1e3e5",
        textAlign: "center"
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "#202223" }}>
          Need Help?
        </h3>
        <p style={{ fontSize: "14px", color: "#6d7175", marginBottom: "16px" }}>
          If you're still having trouble, please contact our support team.
        </p>
        <a
          href="/app/support"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#ffffff",
            color: "#202223",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            border: "1px solid #c9cccf",
            transition: "background-color 0.2s ease",
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f6f6f7"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
        >
          Contact Support
        </a>
      </div> */}
    </div>
  );
}
