import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    lastUpdated: "2025-10-20",
    appName: "Amazon Importer",
    contactEmail: "devyassinepro@gmail.com"
  });
};

export default function TermsOfService() {
  const { lastUpdated, appName, contactEmail } = useLoaderData<typeof loader>();
  
  return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "2rem",
      fontFamily: "system-ui, sans-serif",
      lineHeight: "1.6"
    }}>
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> {lastUpdated}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>
        By installing and using {appName}, you agree to be bound by these Terms of Service.
        If you do not agree to these terms, do not use our service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        {appName} is a Shopify application that allows merchants to:
      </p>
      <ul>
        <li>Modify product prices in bulk</li>
        <li>Apply percentage, fixed, add, or subtract pricing adjustments</li>
        <li>Track pricing history and changes</li>
        <li>Manage pricing quotas based on subscription plans</li>
      </ul>

      <h2>3. Subscription Plans and Billing</h2>
      <h3>3.1 Plan Types</h3>
      <ul>
        <li><strong>Free Plan:</strong> 20 unique products per month</li>
        <li><strong>Standard Plan:</strong> $9.99/month - 500 unique products</li>
        <li><strong>Pro Plan:</strong> $19.99/month - Unlimited products</li>
      </ul>
      
      <h3>3.2 Billing</h3>
      <ul>
        <li>Subscription fees are billed monthly through Shopify</li>
        <li>Usage resets on your billing anniversary</li>
        <li>No refunds for partial months</li>
        <li>You can cancel anytime from your Shopify admin</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the service for illegal activities</li>
        <li>Attempt to reverse engineer or hack the application</li>
        <li>Share your account credentials with others</li>
        <li>Use the service to harm Shopify's platform</li>
        <li>Exceed rate limits or abuse the service</li>
      </ul>

      <h2>5. Data and Privacy</h2>
      <p>
        Your use of the service is also governed by our Privacy Policy.
        We process your data in accordance with Shopify's requirements and GDPR.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        {appName} is provided "as is" without warranties. We are not liable for:
      </p>
      <ul>
        <li>Data loss or pricing errors</li>
        <li>Service interruptions</li>
        <li>Lost profits or business opportunities</li>
        <li>Indirect or consequential damages</li>
      </ul>

      <h2>7. Service Availability</h2>
      <p>
        While we strive for 99.9% uptime, we do not guarantee uninterrupted service.
        Scheduled maintenance will be announced in advance when possible.
      </p>

      <h2>8. Termination</h2>
      <p>
        Either party may terminate this agreement at any time. Upon termination:
      </p>
      <ul>
        <li>Your access to the service will cease immediately</li>
        <li>Your data will be deleted within 30 days</li>
        <li>Outstanding charges remain due</li>
      </ul>

      <h2>9. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the service
        after changes constitutes acceptance of the new terms.
      </p>

      <h2>10. Contact Information</h2>
      <p>
        For questions about these Terms of Service:
        <br />
        Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
    </div>
  );
}