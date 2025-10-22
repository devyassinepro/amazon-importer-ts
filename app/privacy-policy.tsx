import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    lastUpdated: "2025-07-28",
    appName: "Amazon Importer",
    contactEmail: "devyassinepro@gmail.com"
  });
};

export default function PrivacyPolicy() {
  const { lastUpdated, appName, contactEmail } = useLoaderData<typeof loader>();
  
  return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "2rem",
      fontFamily: "system-ui, sans-serif",
      lineHeight: "1.6"
    }}>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {lastUpdated}</p>
      
      <h2>1. Information We Collect</h2>
      <p>
        When you use {appName}, we collect the following information:
      </p>
      <ul>
        <li><strong>Shop Information:</strong> Your shop domain, plan details, and usage statistics</li>
        <li><strong>Product Data:</strong> Product titles, prices, and variants for pricing modifications</li>
        <li><strong>Usage Data:</strong> How you interact with our app, features used, and performance metrics</li>
        <li><strong>Technical Data:</strong> IP address, browser type, and device information</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Provide and maintain the pricing modification service</li>
        <li>Process your pricing updates and track usage quotas</li>
        <li>Send important service notifications and updates</li>
        <li>Improve our app's functionality and user experience</li>
        <li>Provide customer support</li>
      </ul>

      <h2>3. Data Storage and Security</h2>
      <p>
        Your data is stored securely using industry-standard encryption. We use:
      </p>
      <ul>
        <li>Encrypted database connections</li>
        <li>Regular security audits</li>
        <li>Access controls and authentication</li>
        <li>Secure hosting infrastructure</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell, trade, or share your personal information with third parties, except:
      </p>
      <ul>
        <li>When required by law</li>
        <li>To protect our rights and safety</li>
        <li>With your explicit consent</li>
      </ul>

      <h2>5. Your Rights (GDPR)</h2>
      <p>If you are in the EU, you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your data</li>
        <li><strong>Rectification:</strong> Correct inaccurate data</li>
        <li><strong>Erasure:</strong> Delete your data</li>
        <li><strong>Portability:</strong> Export your data</li>
        <li><strong>Objection:</strong> Object to data processing</li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active or as needed to provide services.
        When you uninstall the app, your data is automatically deleted within 30 days.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        For any questions about this Privacy Policy, contact us at:
        <br />
        Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </p>
    </div>
  );
}
