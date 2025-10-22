import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    appName: "Amazon Importer",
    contactEmail: "devyassinepro@gmail.com",
    documentationUrl: "https://docs.yourapp.com"
  });
};

export default function Support() {
  const { appName, contactEmail, documentationUrl } = useLoaderData<typeof loader>();
  
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
          <li><strong>Select products</strong> you want to modify using our filters</li>
          <li><strong>Choose adjustment type</strong> (percentage, fixed price, etc.)</li>
          <li><strong>Preview changes</strong> before applying them</li>
          <li><strong>Apply updates</strong> and track your quota usage</li>
        </ol>
      </div>

      <h2>📋 Frequently Asked Questions</h2>
      
      <div style={{ marginBottom: "2rem" }}>
        <h3>How does the product-based quota work?</h3>
        <p>
          Our quota system counts unique products, not individual price changes. 
          This means you can modify all variants of a product (size, color, etc.) 
          and it only counts as 1 toward your monthly limit.
        </p>
        
        <h3>What happens when I reach my limit?</h3>
        <p>
          When you reach your monthly quota, you'll need to upgrade your plan to 
          continue making changes. Your quota resets on your billing anniversary.
        </p>
        
        <h3>Can I modify the same product multiple times?</h3>
        <p>
          Yes! Once a product is modified within the current month, you can update 
          it again without using additional quota units.
        </p>
        
        <h3>How do I upgrade or downgrade my plan?</h3>
        <p>
          You can change your plan anytime from the Billing page in the app. 
          Changes take effect immediately with prorated billing.
        </p>
        
        <h3>Is my data secure?</h3>
        <p>
          Yes, we use industry-standard encryption and security measures. 
          Your data is automatically deleted when you uninstall the app.
        </p>
      </div>

      <h2>📧 Contact Support</h2>
      <div style={{ 
        backgroundColor: "#f9f9f9", 
        padding: "1.5rem", 
        borderRadius: "8px",
        marginBottom: "2rem"
      }}>
        <p><strong>Email:</strong> <a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
        <p><strong>Response Time:</strong></p>
        <ul>
          <li>Free Plan: 48-72 hours</li>
          <li>Standard Plan: 24-48 hours</li>
          <li>Pro Plan: 12-24 hours</li>
        </ul>
        <p><strong>Documentation:</strong> <a href={documentationUrl} target="_blank" rel="noopener noreferrer">View full documentation</a></p>
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
        <h3>Price changes not applying?</h3>
        <ul>
          <li>Check if you've reached your monthly quota</li>
          <li>Verify product permissions in your store</li>
          <li>Ensure prices are within valid ranges ($0.01 - $99,999)</li>
          <li>Check the modification history for error details</li>
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
        border: "1px solid #ffeaa7"
      }}>
        <p><strong>⚠️ Need immediate help?</strong></p>
        <p>
          For urgent issues affecting your business, email us at{" "}
          <a href={`mailto:${contactEmail}?subject=URGENT: ${appName} Issue`}>
            {contactEmail}
          </a> with "URGENT" in the subject line.
        </p>
      </div>
    </div>
  );
}
