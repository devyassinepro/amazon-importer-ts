/**
 * Terms of Service Page (Public)
 * Accessible at: /terms-of-service
 */

import type { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return {
    lastUpdated: "2025-10-20",
    appName: "Amazon Importer",
    contactEmail: "devyassinepro@gmail.com"
  };
};

export default function TermsOfService() {
  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "2rem",
      fontFamily: "system-ui, sans-serif",
      lineHeight: "1.6"
    }}>
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> October 20, 2025</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By installing and using Amazon Importer, you agree to be bound by these Terms of Service.
        If you do not agree to these terms, do not use our service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Amazon Importer is a Shopify application that allows merchants to:
      </p>
      <ul>
        <li>Import products from Amazon to Shopify</li>
        <li>Apply pricing markups and modifications</li>
        <li>Manage product variants and images</li>
        <li>Track imported products and history</li>
        <li>Use Amazon affiliate links (optional)</li>
      </ul>

      <h2>3. Subscription Plans and Billing</h2>
      <h3>3.1 Plan Types</h3>
      <ul>
        <li><strong>Free Plan:</strong> 20 products - No charge</li>
        <li><strong>Basic Plan:</strong> €4.99/month - 150 products</li>
        <li><strong>Pro Plan:</strong> €9.99/month - 1000 products</li>
        <li><strong>Premium Plan:</strong> €19.99/month - 3000 products</li>
      </ul>

      <h3>3.2 Billing</h3>
      <ul>
        <li>Subscription fees are billed monthly through Shopify</li>
        <li>Product limits are enforced based on your current plan</li>
        <li>No refunds for partial months</li>
        <li>You can cancel anytime from your Shopify admin</li>
        <li>Downgrades take effect at the end of your billing period</li>
      </ul>

      <h2>4. Amazon Compliance</h2>
      <p>You agree to:</p>
      <ul>
        <li>Comply with Amazon's Terms of Service</li>
        <li>Follow Amazon Associate Program Operating Agreement (if using affiliate mode)</li>
        <li>Not misrepresent products or prices</li>
        <li>Not use Amazon trademarks without permission</li>
        <li>Maintain accurate product information</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for illegal activities</li>
        <li>Attempt to reverse engineer or hack the application</li>
        <li>Share your account credentials with others</li>
        <li>Use the service to harm Shopify's platform</li>
        <li>Exceed rate limits or abuse the service</li>
        <li>Import counterfeit or prohibited products</li>
      </ul>

      <h2>6. Dropshipping vs Affiliate Mode</h2>
      <h3>6.1 Dropshipping Mode</h3>
      <p>
        When using dropshipping mode, you are responsible for:
      </p>
      <ul>
        <li>Fulfilling orders with actual Amazon products</li>
        <li>Maintaining adequate inventory tracking</li>
        <li>Handling customer service and returns</li>
        <li>Complying with your local laws and regulations</li>
      </ul>

      <h3>6.2 Affiliate Mode</h3>
      <p>
        When using affiliate mode, you must:
      </p>
      <ul>
        <li>Have an active Amazon Associates account</li>
        <li>Display proper affiliate disclosures</li>
        <li>Comply with Amazon's affiliate program rules</li>
        <li>Not sell products directly (button redirects to Amazon)</li>
      </ul>

      <h2>7. Data and Privacy</h2>
      <p>
        Your use of the service is also governed by our Privacy Policy.
        We process your data in accordance with Shopify's requirements and GDPR.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        Amazon Importer is provided "as is" without warranties. We are not liable for:
      </p>
      <ul>
        <li>Data loss or import errors</li>
        <li>Service interruptions</li>
        <li>Lost profits or business opportunities</li>
        <li>Indirect or consequential damages</li>
        <li>Amazon API changes or restrictions</li>
        <li>Product availability or pricing changes</li>
      </ul>

      <h2>9. Service Availability</h2>
      <p>
        While we strive for 99.9% uptime, we do not guarantee uninterrupted service.
        Scheduled maintenance will be announced in advance when possible.
      </p>

      <h2>10. Termination</h2>
      <p>
        Either party may terminate this agreement at any time. Upon termination:
      </p>
      <ul>
        <li>Your access to the service will cease immediately</li>
        <li>Your data will be deleted within 30 days</li>
        <li>Outstanding charges remain due</li>
        <li>Previously imported products remain in your Shopify store</li>
      </ul>

      <h2>11. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the service
        after changes constitutes acceptance of the new terms. Material changes
        will be notified via email or in-app notification.
      </p>

      <h2>12. Contact Information</h2>
      <p>
        For questions about these Terms of Service:
        <br />
        Email: <a href="mailto:devyassinepro@gmail.com">devyassinepro@gmail.com</a>
      </p>

      <div style={{
        marginTop: "3rem",
        paddingTop: "2rem",
        borderTop: "1px solid #e5e5e5",
        textAlign: "center",
        color: "#666"
      }}>
        <p>© 2025 Amazon Importer. All rights reserved.</p>
      </div>
    </div>
  );
}
