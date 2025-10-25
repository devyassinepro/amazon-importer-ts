# GDPR Webhooks Configuration Guide

## 📋 Required GDPR Webhooks

Your app MUST implement these 3 webhooks for Shopify App Store approval:

### 1. customers/data_request
**URL:** `https://amazonimporter-app-zffzk.ondigitalocean.app/webhooks/customers/data_request`

**Purpose:** Responds to customer data requests (GDPR Article 15)

**Implementation:** ✅ `/app/routes/webhooks.customers.data_request.tsx`

---

### 2. customers/redact
**URL:** `https://amazonimporter-app-zffzk.ondigitalocean.app/webhooks/customers/redact`

**Purpose:** Deletes customer data upon request (GDPR Article 17)

**Implementation:** ✅ `/app/routes/webhooks.customers.redact.tsx`

---

### 3. shop/redact
**URL:** `https://amazonimporter-app-zffzk.ondigitalocean.app/webhooks/shop/redact`

**Purpose:** Deletes all shop data 48 hours after uninstall (GDPR compliance)

**Implementation:** ✅ `/app/routes/webhooks.shop.redact.tsx`

---

## 🔧 Configuration Methods

### Method 1: Partner Dashboard (Recommended)

1. **Access Partner Dashboard**
   - Go to: https://partners.shopify.com/
   - Select: "Amazon Importer" app

2. **Navigate to Settings**
   - Click: **"Settings"** in left sidebar
   - Find: **"Data protection"** or **"GDPR"** section

3. **Add GDPR Webhooks**

   For each webhook, enter:

   ```
   Topic: customers/data_request
   URL: https://amazonimporter-app-zffzk.ondigitalocean.app/webhooks/customers/data_request
   ```

   ```
   Topic: customers/redact
   URL: https://amazonimporter-app-zffzk.ondigitalocean.app/webhooks/customers/redact
   ```

   ```
   Topic: shop/redact
   URL: https://amazonimporter-app-zffzk.ondigitalocean.app/webhooks/shop/redact
   ```

4. **Save and Test**
   - Click "Save" for each webhook
   - Shopify will automatically test each endpoint
   - Verify HMAC signature validation passes

---

### Method 2: Via App Listing Submission

If you don't see a dedicated GDPR section:

1. **Go to App Listing**
   - Partner Dashboard → Your App → "App listing"

2. **In the "Compliance" section**
   - Look for "GDPR webhooks" or "Mandatory webhooks"
   - Enter the 3 webhook URLs

3. **During App Review**
   - Shopify will test these endpoints
   - They must respond with valid JSON
   - HMAC signatures must be validated

---

## ✅ Verification Checklist

Before submitting your app:

- [ ] All 3 webhook routes exist in `/app/routes/webhooks.*.tsx`
- [ ] Each webhook uses `authenticate.webhook(request)` for HMAC validation
- [ ] Endpoints are deployed to production: https://amazonimporter-app-zffzk.ondigitalocean.app
- [ ] Webhooks return proper HTTP responses (200 OK)
- [ ] Customer data is properly handled (or noted that none is stored)
- [ ] Shop data is completely deleted in shop/redact
- [ ] Privacy Policy includes GDPR compliance information

---

## 🧪 Testing GDPR Webhooks

### Test with Shopify CLI

```bash
# Test from a dev store (Shopify will send test webhooks)
shopify app dev
```

### Manual Testing

You can test the endpoints locally, but they will reject requests without valid HMAC:

```bash
# This will fail (no HMAC signature) - which is GOOD!
curl -X POST https://amazonimporter-app-zffzk.ondigitalocean.app/webhooks/customers/data_request \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

Shopify will send properly signed requests during testing.

---

## 📚 Additional Resources

- [Shopify GDPR Webhooks Docs](https://shopify.dev/docs/apps/build/privacy-law-compliance)
- [GDPR Compliance Guide](https://shopify.dev/docs/apps/store/data-protection/gdpr)
- [Webhook Authentication](https://shopify.dev/docs/apps/build/webhooks/subscribe/https)

---

## ⚠️ Important Notes

1. **Don't declare GDPR webhooks in shopify.app.toml**
   - They are configured separately via Partner Dashboard
   - Only app/uninstalled and app/scopes_update go in shopify.app.toml

2. **HMAC validation is MANDATORY**
   - All webhooks must verify the `X-Shopify-Hmac-Sha256` header
   - Our implementation uses `authenticate.webhook(request)` which handles this automatically

3. **Response requirements**
   - Must return HTTP 200 OK
   - Must complete within 5 seconds
   - Should return JSON (optional but recommended)

4. **Data handling**
   - customers/data_request: Return customer data OR state that none is stored
   - customers/redact: Delete all customer data
   - shop/redact: Delete ALL shop data (called 48h after uninstall)

---

## 🎯 Summary

Your app is **GDPR compliant** with all required webhooks implemented.

**Next step:** Configure these webhook URLs in the Shopify Partner Dashboard under your app's settings or app listing compliance section.
