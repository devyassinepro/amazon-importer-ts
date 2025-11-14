/**
 * Support Page (Public)
 * Accessible at: /support
 */

import type { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return {
    appName: "Amazon Importer",
    contactEmail: "devyassinepro@gmail.com",
    documentationUrl: "https://docs.yourapp.com"
  };
};

export default function Support() {
  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "2rem",
      fontFamily: "system-ui, sans-serif",
      lineHeight: "1.6"
    }}>
      <h1>Support & Help Center</h1>

      <div style={{
        backgroundColor: "#f0f8ff",
        padding: "1.5rem",
        borderRadius: "8px",
        marginBottom: "2rem"
      }}>
        <h2>🚀 Quick Start Guide</h2>
        <ol>
          <li><strong>Install the app</strong> from the Shopify App Store</li>
          <li><strong>Accept terms</strong> and configure your settings</li>
          <li><strong>Paste Amazon URL</strong> for the product you want to import</li>
          <li><strong>Fetch product</strong> and preview all details</li>
          <li><strong>Customize pricing</strong> with markup (multiplier or fixed)</li>
          <li><strong>Import to Shopify</strong> and track in History page</li>
        </ol>
      </div>

      <h2>📋 Frequently Asked Questions</h2>

      <div style={{ marginBottom: "2rem" }}>
        <h3>How does the product limit work?</h3>
        <p>
          Each plan has a product limit (Free: 20, Basic: 150, Pro: 1000, Premium: 3000).
          Every product you import counts toward this limit. Both draft and active products count.
          You can delete products to free up space.
        </p>

        <h3>What's the difference between Dropshipping and Affiliate mode?</h3>
        <p>
          <strong>Dropshipping:</strong> Import full product to your store. You handle checkout and fulfillment.
          <br />
          <strong>Affiliate:</strong> Add "Buy on Amazon" button. Customers redirected to Amazon. You earn commissions.
        </p>

        <h3>Can I import products with variants?</h3>
        <p>
          Yes! Our app automatically detects and imports all variants (size, color, etc.) from Amazon.
          All variants are created in Shopify with proper images and pricing.
        </p>

        <h3>How do pricing markups work?</h3>
        <p>
          You can apply markups in two ways:
          <br />
          • <strong>Multiplier:</strong> Multiply price by X (e.g., 1.2 = 20% markup)
          <br />
          • <strong>Fixed:</strong> Add fixed amount (e.g., +5.00 USD)
        </p>

        <h3>Can I edit products after importing?</h3>
        <p>
          Yes! Once imported, products are regular Shopify products. You can edit them
          in your Shopify admin or through our History page.
        </p>

        <h3>What happens when I reach my limit?</h3>
        <p>
          When you reach your product limit, you'll need to upgrade your plan or delete
          existing products to continue importing. Your limit is shown on the Billing page.
        </p>

        <h3>How do I upgrade or downgrade my plan?</h3>
        <p>
          Visit the Billing page in the app. Changes take effect immediately with
          prorated billing handled by Shopify.
        </p>

        <h3>Is my data secure?</h3>
        <p>
          Yes! We use industry-standard encryption, secure database connections, and
          comply with GDPR. Your data is automatically deleted when you uninstall the app.
        </p>

        <h3>Which Amazon marketplaces are supported?</h3>
        <p>
          We support 12+ Amazon marketplaces: US, UK, Germany, France, Italy, Spain,
          Canada, Japan, India, Mexico, Brazil, and Australia.
        </p>
      </div>

      <h2>📧 Contact Support</h2>
      <div style={{
        backgroundColor: "#f9f9f9",
        padding: "1.5rem",
        borderRadius: "8px",
        marginBottom: "2rem"
      }}>
        <p><strong>Email:</strong> <a href="mailto:devyassinepro@gmail.com">devyassinepro@gmail.com</a></p>
        <p><strong>Response Time:</strong></p>
        <ul>
          <li>Free Plan: 48-72 hours</li>
          <li>Basic Plan: 24-48 hours</li>
          <li>Pro Plan: 12-24 hours</li>
          <li>Premium Plan: Priority support (12-24 hours)</li>
        </ul>
      </div>

      <h2>🔧 Troubleshooting</h2>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3>App not loading?</h3>
        <ul>
          <li>Clear your browser cache and cookies</li>
          <li>Try a different browser or incognito mode</li>
          <li>Check if you have ad blockers disabled</li>
          <li>Ensure you're accessing through Shopify admin</li>
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Product import failed?</h3>
        <ul>
          <li>Check if the Amazon URL is valid and accessible</li>
          <li>Verify you haven't reached your product limit</li>
          <li>Ensure the product is available on Amazon</li>
          <li>Try refreshing and importing again</li>
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Images not showing?</h3>
        <ul>
          <li>Amazon sometimes blocks direct image access</li>
          <li>Try re-importing the product</li>
          <li>Images are cached and may take a moment to load</li>
          <li>Check your Shopify media library permissions</li>
        </ul>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Billing issues?</h3>
        <ul>
          <li>Billing is handled through your Shopify account</li>
          <li>Check your Shopify billing settings</li>
          <li>Contact Shopify support for payment issues</li>
          <li>Email us for plan-specific questions</li>
        </ul>
      </div>

      <div style={{
        backgroundColor: "#fff3cd",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid #ffeaa7",
        marginBottom: "2rem"
      }}>
        <p><strong>⚠️ Need immediate help?</strong></p>
        <p>
          For urgent issues affecting your business, email us at{" "}
          <a href="mailto:devyassinepro@gmail.com?subject=URGENT: Amazon Importer Issue">
            devyassinepro@gmail.com
          </a> with "URGENT" in the subject line.
        </p>
      </div>

      <div style={{
        backgroundColor: "#e7f3ff",
        padding: "1.5rem",
        borderRadius: "8px",
        marginBottom: "2rem"
      }}>
        <h3>💡 Pro Tips</h3>
        <ul>
          <li>Use collections to organize imported products</li>
          <li>Set default pricing markup in Settings to save time</li>
          <li>Check History page to track all imports</li>
          <li>Use filters to find specific products quickly</li>
          <li>Monitor your product limit on the Billing page</li>
        </ul>
      </div>

      <div style={{
        marginTop: "3rem",
        paddingTop: "2rem",
        borderTop: "1px solid #e5e5e5",
        textAlign: "center",
        color: "#666"
      }}>
        <p>© 2025 Amazon Importer. All rights reserved.</p>
        <p style={{ marginTop: "1rem" }}>
          <a href="/privacy-policy" style={{ marginRight: "1rem" }}>Privacy Policy</a>
          <a href="/terms-of-service">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
