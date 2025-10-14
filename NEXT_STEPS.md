# 🚀 Prochaines Étapes - Amazon Importer TypeScript

## Configuration Initiale

### 1. Générer les Migrations Prisma

```bash
cd /Users/touzani/Desktop/amazon-importer/amazon-importer-ts
npx prisma migrate dev --name init
```

Cette commande va créer les tables dans la base de données SQLite.

### 2. Copier les Extensions Shopify

Les extensions de thème (bouton Amazon) doivent être copiées :

```bash
# Copier le dossier extensions depuis le projet JS
cp -r ../amazon-importer-js/extensions ./extensions
```

### 3. Copier les Fichiers de Configuration

```bash
# Copier shopify.app.toml
cp ../amazon-importer-js/shopify.app.toml ./

# Copier .env si nécessaire
cp ../amazon-importer-js/.env ./.env
```

---

## Routes à Créer

### Route 1 : `app/routes/app._index.tsx`

Voici un squelette de base pour démarrer :

\`\`\`typescript
import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";
import { scrapeAmazonProduct } from "~/services/amazon-scraper.server";
import { createShopifyProduct } from "~/services/shopify-product.server";
import { applyPricingMarkup } from "~/services/pricing.server";
import { ImportModeSelector } from "~/components/ImportModeSelector";
import { TermsModal } from "~/components/TermsModal";
import { ProductPreviewSkeleton } from "~/components/ProductPreviewSkeleton";
import type { ImportMode, PricingMode, ScrapedProduct, AppSettings } from "~/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch app settings
  const settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });

  // Fetch collections
  const collectionsResponse = await admin.graphql(
    \`#graphql
      query getCollections {
        collections(first: 250) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    \`,
  );

  const collectionsJson = await collectionsResponse.json();
  const collections = collectionsJson.data?.collections?.edges?.map((e: any) => e.node) || [];

  return { settings, collections, shop: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "acceptTerms") {
    // Accept terms logic
    await prisma.appSettings.upsert({
      where: { shop: session.shop },
      create: {
        shop: session.shop,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
      update: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    });
    return { success: true, action: "acceptTerms" };
  }

  if (action === "scrape") {
    const amazonUrl = formData.get("amazonUrl") as string;
    const settings = await prisma.appSettings.findUnique({
      where: { shop: session.shop },
    });

    const result = await scrapeAmazonProduct(
      amazonUrl,
      settings?.rapidApiKey || null,
    );

    return { success: result.success, data: result.data, error: result.error };
  }

  if (action === "import") {
    // Import logic
    const productDataJson = formData.get("productData") as string;
    const amazonUrl = formData.get("amazonUrl") as string;
    const importMode = formData.get("importMode") as ImportMode;
    const markupType = formData.get("markupType") as PricingMode;
    const markupValue = parseFloat(formData.get("markupValue") as string);
    const shouldPublish = formData.get("shouldPublish") === "true";

    const productData: ScrapedProduct = JSON.parse(productDataJson);

    // Apply pricing if dropshipping
    if (importMode === "DROPSHIPPING") {
      productData.price = applyPricingMarkup(
        productData.price,
        markupType,
        markupValue,
      );
    }

    const settings = await prisma.appSettings.findUnique({
      where: { shop: session.shop },
    });

    // Create Shopify product
    const result = await createShopifyProduct(
      admin,
      productData,
      amazonUrl,
      settings,
      shouldPublish,
    );

    if (result.success && result.product) {
      // Save to database
      await prisma.importedProduct.create({
        data: {
          shop: session.shop,
          shopifyProductId: result.product.id,
          shopifyHandle: result.product.handle,
          amazonUrl,
          amazonAsin: productData.asin,
          title: productData.title,
          description: productData.description,
          price: productData.price,
          originalPrice: productData.price,
          markup: markupValue,
          markupType,
          importMode,
          productImage: productData.images[0],
          images: JSON.stringify(productData.images),
          variantCount: productData.variants.length,
          status: shouldPublish ? "ACTIVE" : "DRAFT",
        },
      });
    }

    return result;
  }

  return { success: false, error: "Invalid action" };
};

export default function Index() {
  const { settings, collections } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [showTerms, setShowTerms] = useState(!settings?.termsAccepted);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [productData, setProductData] = useState<ScrapedProduct | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("DROPSHIPPING");
  const [markupType, setMarkupType] = useState<PricingMode>("MULTIPLIER");
  const [markupValue, setMarkupValue] = useState(1.5);

  // TODO: Implement the full UI with:
  // - Amazon URL input
  // - Fetch button
  // - Product preview
  // - Import mode selector
  // - Collection selector
  // - Draft/Active toggle
  // - Import button

  return (
    <s-page heading="Import Amazon Products">
      <TermsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          fetcher.submit({ action: "acceptTerms" }, { method: "POST" });
          setShowTerms(false);
        }}
      />

      {/* TODO: Add your UI here */}
      <s-section heading="Amazon Product URL">
        <s-textfield
          value={amazonUrl}
          onChange={(e) => setAmazonUrl(e.target.value)}
          placeholder="https://www.amazon.com/dp/..."
          label="Amazon Product URL"
        />
        <s-button
          onClick={() => {
            const formData = new FormData();
            formData.append("action", "scrape");
            formData.append("amazonUrl", amazonUrl);
            fetcher.submit(formData, { method: "POST" });
          }}
        >
          Fetch Product
        </s-button>
      </s-section>
    </s-page>
  );
}

export const headers = boundary.headers;
\`\`\`

### Route 2 : `app/routes/app.history.tsx`

Squelette de base :

\`\`\`typescript
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const products = await prisma.importedProduct.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  return { products };
};

export default function History() {
  const { products } = useLoaderData<typeof loader>();

  // TODO: Implement data table with filters and stats

  return (
    <s-page heading="Import History">
      <s-paragraph>Total products: {products.length}</s-paragraph>
      {/* TODO: Add data table */}
    </s-page>
  );
}

export const headers = boundary.headers;
\`\`\`

### Route 3 : `app/routes/app.settings.tsx`

Squelette de base :

\`\`\`typescript
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "~/shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { prisma } from "~/db.server";
import type { AppSettings } from "~/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const settings = await prisma.appSettings.findUnique({
    where: { shop: session.shop },
  });

  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  // Parse form data
  const data = {
    rapidApiKey: formData.get("rapidApiKey") as string,
    amazonAffiliateId: formData.get("amazonAffiliateId") as string,
    affiliateModeEnabled: formData.get("affiliateModeEnabled") === "true",
    buttonText: formData.get("buttonText") as string,
    buttonEnabled: formData.get("buttonEnabled") === "true",
    buttonPosition: formData.get("buttonPosition") as string,
    pricingMode: formData.get("pricingMode") as string,
    pricingValue: parseFloat(formData.get("pricingValue") as string),
    defaultImportMode: formData.get("defaultImportMode") as string,
  };

  await prisma.appSettings.upsert({
    where: { shop: session.shop },
    create: { shop: session.shop, ...data },
    update: data,
  });

  return { success: true };
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  // TODO: Implement settings form

  return (
    <s-page heading="Settings">
      {/* TODO: Add settings form */}
    </s-page>
  );
}

export const headers = boundary.headers;
\`\`\`

---

## Tests à Effectuer

1. **Test de Compilation TypeScript**
   ```bash
   npm run typecheck
   ```

2. **Test du Serveur de Développement**
   ```bash
   npm run dev
   ```

3. **Test de la Base de Données**
   ```bash
   npx prisma studio
   ```

---

## Ressources Utiles

- **Shopify App Development** : https://shopify.dev/docs/apps
- **React Router v7** : https://reactrouter.com/
- **Polaris Web Components** : https://shopify.dev/docs/api/app-home
- **Prisma ORM** : https://www.prisma.io/docs
- **RapidAPI Amazon Data** : https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data

---

## Support

Si vous rencontrez des problèmes :

1. Vérifiez que toutes les dépendances sont installées : `npm install`
2. Vérifiez que le client Prisma est généré : `npx prisma generate`
3. Vérifiez les erreurs TypeScript : `npm run typecheck`
4. Consultez les logs du serveur : `npm run dev`

**Bon développement ! 🎉**
