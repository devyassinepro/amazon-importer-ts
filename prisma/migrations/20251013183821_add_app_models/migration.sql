-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "rapidApiKey" TEXT,
    "amazonAffiliateId" TEXT,
    "affiliateModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "buttonText" TEXT NOT NULL DEFAULT 'Buy on Amazon',
    "buttonEnabled" BOOLEAN NOT NULL DEFAULT true,
    "buttonPosition" TEXT NOT NULL DEFAULT 'AFTER_BUY_NOW',
    "pricingMode" TEXT NOT NULL DEFAULT 'MULTIPLIER',
    "pricingValue" REAL NOT NULL DEFAULT 1.0,
    "defaultImportMode" TEXT NOT NULL DEFAULT 'DROPSHIPPING',
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImportedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyHandle" TEXT,
    "shopifyVariantId" TEXT,
    "amazonUrl" TEXT NOT NULL,
    "amazonAsin" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "originalPrice" REAL NOT NULL,
    "markup" REAL,
    "markupType" TEXT,
    "importMode" TEXT NOT NULL DEFAULT 'DROPSHIPPING',
    "productImage" TEXT,
    "images" TEXT,
    "variantCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");

-- CreateIndex
CREATE INDEX "ImportedProduct_shop_idx" ON "ImportedProduct"("shop");

-- CreateIndex
CREATE INDEX "ImportedProduct_shopifyProductId_idx" ON "ImportedProduct"("shopifyProductId");

-- CreateIndex
CREATE INDEX "ImportedProduct_createdAt_idx" ON "ImportedProduct"("createdAt");

-- CreateIndex
CREATE INDEX "ImportedProduct_importMode_idx" ON "ImportedProduct"("importMode");
