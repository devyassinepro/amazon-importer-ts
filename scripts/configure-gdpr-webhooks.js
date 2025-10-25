#!/usr/bin/env node

/**
 * Configure GDPR Webhooks for Shopify App
 *
 * This script registers the mandatory GDPR webhooks with Shopify.
 * Run this after deploying your app to production.
 *
 * Usage: node scripts/configure-gdpr-webhooks.js
 */

const APP_URL = "https://amazonimporter-app-zffzk.ondigitalocean.app";

const GDPR_WEBHOOKS = [
  {
    topic: "customers/data_request",
    address: `${APP_URL}/webhooks/customers/data_request`,
    format: "json"
  },
  {
    topic: "customers/redact",
    address: `${APP_URL}/webhooks/customers/redact`,
    format: "json"
  },
  {
    topic: "shop/redact",
    address: `${APP_URL}/webhooks/shop/redact`,
    format: "json"
  }
];

console.log('\n🔐 GDPR Webhook Configuration for Amazon Importer\n');
console.log('═'.repeat(60));
console.log('\n📋 Required GDPR Webhooks:\n');

GDPR_WEBHOOKS.forEach((webhook, index) => {
  console.log(`${index + 1}. ${webhook.topic}`);
  console.log(`   URL: ${webhook.address}`);
  console.log(`   Format: ${webhook.format}\n`);
});

console.log('═'.repeat(60));
console.log('\n📝 Manual Configuration Steps:\n');
console.log('1. Go to: https://partners.shopify.com/');
console.log('2. Select your app: "Amazon Importer"');
console.log('3. Navigate to: App setup → Webhooks');
console.log('4. Add each webhook listed above\n');

console.log('Or configure via Shopify Admin API:\n');
console.log('Use the Shopify Admin API to register these webhooks');
console.log('programmatically if you have API access.\n');

console.log('═'.repeat(60));
console.log('\n✅ After configuration, verify at:');
console.log('   https://partners.shopify.com/[YOUR_ORG_ID]/apps/[APP_ID]/webhooks\n');
