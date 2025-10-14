// ==========================================
// Database Types (Prisma Models)
// ==========================================

export interface AppSettings {
  id: string;
  shop: string;
  rapidApiKey: string | null;
  amazonAffiliateId: string | null;
  affiliateModeEnabled: boolean;
  buttonText: string;
  buttonEnabled: boolean;
  buttonPosition: string;
  pricingMode: PricingMode;
  pricingValue: number;
  defaultImportMode: ImportMode;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportedProduct {
  id: string;
  shop: string;
  shopifyProductId: string;
  shopifyHandle: string | null;
  shopifyVariantId: string | null;
  amazonUrl: string;
  amazonAsin: string | null;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number;
  markup: number | null;
  markupType: string | null;
  importMode: ImportMode;
  productImage: string | null;
  images: string | null;
  variantCount: number;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Enum Types
// ==========================================

export type ImportMode = "AFFILIATE" | "DROPSHIPPING";
export type PricingMode = "MULTIPLIER" | "FIXED";
export type ProductStatus = "DRAFT" | "ACTIVE";
export type ButtonPosition =
  | "BEFORE_BUY_NOW"
  | "AFTER_BUY_NOW"
  | "AFTER_ADD_TO_CART"
  | "BEFORE_ADD_TO_CART";

// ==========================================
// Amazon Product Types
// ==========================================

export interface AmazonProductData {
  asin: string;
  title: string;
  description: string;
  link: string;
  main_image: {
    link: string;
  };
  images: Array<{
    link: string;
  }>;
  price: {
    current_price: number;
    currency: string;
    raw?: string;
  };
  product_information?: Record<string, string>;
  feature_bullets?: string[];
  rating?: number;
  ratings_total?: number;
  categories?: Array<{
    name: string;
  }>;
  is_prime?: boolean;
  is_amazon_choice?: boolean;
  availability?: {
    status: string;
  };
  all_product_variations?: {
    options: Array<{
      title: string;
      values: string[];
    }>;
    data?: Array<{
      asin: string;
      images?: Array<{ link: string }>;
      price?: { current_price?: number };
      availability?: { status?: string };
      dimensions: Record<string, string>;
    }>;
  };
  product_variations?: Array<{
    asin: string;
    title: string;
    price?: { current_price?: number };
    images?: Array<{ link: string }>;
    availability?: { status?: string };
  }>;
}

export interface ScrapedProduct {
  asin: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  variants: ProductVariant[];
  options: ProductOption[];
  amazonUrl: string;
  specifications?: Record<string, string>;
  bulletPoints?: string[];
  rating?: number;
  ratingsTotal?: number;
  categories?: string[];
  isPrime?: boolean;
  isAmazonChoice?: boolean;
  availability?: string;
}

export interface ProductVariant {
  asin: string;
  title?: string;
  price?: number;
  image?: string;
  options: Record<string, string>;
  available: boolean;
}

export interface ProductOption {
  name: string;
  values: string[];
}

// ==========================================
// Shopify Product Types
// ==========================================

export interface ShopifyProductInput {
  title: string;
  descriptionHtml: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: string[];
  variants: ShopifyVariantInput[];
  options: ProductOption[];
  status: "DRAFT" | "ACTIVE";
}

export interface ShopifyVariantInput {
  price: string;
  compareAtPrice?: string;
  sku?: string;
  inventoryPolicy?: "DENY" | "CONTINUE";
  options: string[];
  image?: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: string;
        image?: {
          url: string;
        };
      };
    }>;
  };
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
}

// ==========================================
// Pricing Types
// ==========================================

export interface PricingConfig {
  mode: PricingMode;
  value: number;
}

export interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  markup: number;
  markupPercentage: number;
}

// ==========================================
// Form & UI Types
// ==========================================

export interface ImportFormData {
  amazonUrl: string;
  importMode: ImportMode;
  markupType?: PricingMode;
  markupValue?: number;
  collectionId?: string;
  shouldPublish: boolean;
}

export interface SettingsFormData {
  rapidApiKey: string;
  amazonAffiliateId?: string;
  affiliateModeEnabled: boolean;
  buttonText: string;
  buttonEnabled: boolean;
  buttonPosition: ButtonPosition;
  pricingMode: PricingMode;
  pricingValue: number;
  defaultImportMode: ImportMode;
}

export interface HistoryFilters {
  search?: string;
  importMode?: ImportMode;
  status?: ProductStatus;
  sortBy?: "date" | "price" | "title";
  sortOrder?: "asc" | "desc";
}

// ==========================================
// API Response Types
// ==========================================

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoaderData<T = unknown> {
  data: T;
  error?: string;
}

// ==========================================
// Error Types
// ==========================================

export class AmazonScraperError extends Error {
  constructor(
    message: string,
    public code:
      | "INVALID_URL"
      | "API_KEY_MISSING"
      | "API_ERROR"
      | "PARSE_ERROR"
      | "NETWORK_ERROR",
  ) {
    super(message);
    this.name = "AmazonScraperError";
  }
}

export class ShopifyProductError extends Error {
  constructor(
    message: string,
    public code:
      | "GRAPHQL_ERROR"
      | "PRODUCT_CREATE_ERROR"
      | "VARIANT_CREATE_ERROR"
      | "IMAGE_UPLOAD_ERROR",
  ) {
    super(message);
    this.name = "ShopifyProductError";
  }
}
