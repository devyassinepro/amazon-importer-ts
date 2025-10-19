import axios from "axios";
import type {
  AmazonProductData,
  ScrapedProduct,
  ProductVariant,
  ProductOption,
  AmazonScraperError as AmazonScraperErrorType,
} from "~/types";

/**
 * Parse price string to number
 * Handles various formats: "$15.90", "15,90", "15.90 MAD", etc.
 */
function parsePrice(priceString: string | number | undefined): number {
  if (!priceString) return 0;

  // Convert to string and remove currency symbols and letters
  const cleanPrice = String(priceString)
    .replace(/[^0-9.,]/g, "") // Keep only numbers, dots, and commas
    .replace(/,(\d{3})/g, "$1") // Remove thousand separators (1,000 -> 1000)
    .replace(",", "."); // Replace decimal comma with dot (15,90 -> 15.90)

  const price = parseFloat(cleanPrice) || 0;

  return price;
}

interface VariantsData {
  options: ProductOption[];
  variants: ProductVariant[];
  variantImages: Record<string, string>;
}

interface ProductVariationOption {
  value: string;
  asin?: string;
  photo?: string;
  is_available?: boolean;
}

/**
 * Extracts Amazon product data using RapidAPI
 * @param amazonUrl - The Amazon product URL
 * @param apiKey - RapidAPI key (optional, uses env variable if not provided)
 * @returns Product data or error
 */
export async function scrapeAmazonProduct(
  amazonUrl: string,
  apiKey: string | null = null,
): Promise<{ success: boolean; data?: ScrapedProduct; error?: string }> {
  try {
    // Validate URL
    if (!amazonUrl.includes("amazon.")) {
      throw createScraperError("Invalid Amazon URL", "INVALID_URL");
    }

    // Extract ASIN from URL
    const asin = extractAsin(amazonUrl);

    if (!asin) {
      throw createScraperError(
        "Could not extract ASIN from URL",
        "INVALID_URL",
      );
    }

    // Extract country code from URL (default to US)
    const country = extractCountryFromUrl(amazonUrl);

    // Use provided API key or fallback to environment variable
    const rapidApiKey = apiKey || process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      throw createScraperError(
        "RapidAPI key is required. Please add it in Settings or set RAPIDAPI_KEY environment variable.",
        "API_KEY_MISSING",
      );
    }

    // Fetch product data from RapidAPI
    const response = await axios.get<{
      status: string;
      message?: string;
      data: AmazonProductData;
    }>("https://real-time-amazon-data.p.rapidapi.com/product-details", {
      params: {
        asin: asin,
        country: country,
      },
      headers: {
        "X-Rapidapi-Key": rapidApiKey,
        "X-Rapidapi-Host": "real-time-amazon-data.p.rapidapi.com",
      },
      timeout: 15000,
    });

    if (response.data.status !== "OK") {
      throw createScraperError(
        response.data.message || "Failed to fetch product data from Amazon",
        "API_ERROR",
      );
    }

    const apiData = response.data.data;

    // Check if API returned empty data
    if (!apiData || Object.keys(apiData).length === 0) {
      throw createScraperError(
        "Product not found. This could mean: 1) The ASIN doesn't exist or is no longer available on Amazon, 2) Your RapidAPI key has reached its request limit, or 3) The product is restricted in the selected country. Please check your RapidAPI dashboard at https://rapidapi.com/hub and verify your subscription status.",
        "API_ERROR",
      );
    }

    // Check if we have essential product data (try both old and new API field names)
    const hasTitle = apiData.title || (apiData as any).product_title;
    const hasPrice = apiData.price?.current_price || (apiData as any).product_price;

    if (!hasTitle || !hasPrice) {
      throw createScraperError(
        "Incomplete product data received from Amazon. The product may not be available for sale or may be restricted. Please try a different product URL.",
        "API_ERROR",
      );
    }

    // Check if this is a child ASIN and we need to fetch the parent
    const parentAsin =
      (apiData as any).parent_asin || (apiData as any).landing_asin;
    const isChildAsin = parentAsin && parentAsin !== asin;

    console.log("=== ASIN CHECK ===");
    console.log("Current ASIN:", asin);
    console.log("Parent ASIN:", parentAsin);
    console.log("Is child ASIN?", isChildAsin);

    // If this is a child ASIN, fetch the parent to get all variants
    let productApiData = apiData;
    if (isChildAsin) {
      console.log("Fetching parent ASIN data for all variants...");
      try {
        const parentResponse = await axios.get<{
          status: string;
          data: AmazonProductData;
        }>("https://real-time-amazon-data.p.rapidapi.com/product-details", {
          params: {
            asin: parentAsin,
            country: country,
          },
          headers: {
            "X-Rapidapi-Key": rapidApiKey,
            "X-Rapidapi-Host": "real-time-amazon-data.p.rapidapi.com",
          },
          timeout: 15000,
        });

        if (parentResponse.data.status === "OK" && parentResponse.data.data) {
          productApiData = parentResponse.data.data;
          console.log("Successfully fetched parent ASIN data");
        }
      } catch (error) {
        console.error(
          "Error fetching parent ASIN, using child data:",
          error instanceof Error ? error.message : "Unknown error",
        );
        // Continue with child data if parent fetch fails
      }
    }

    // Format variants using all_product_variations
    const variantsData = formatVariants(productApiData);

    // All variants use the main product price for now
    // Support both old and new API field structures
    const rawPrice = productApiData.price?.current_price || (productApiData as any).product_price;
    const basePrice = parsePrice(rawPrice);

    console.log("=== AMAZON SCRAPER DEBUG ===");
    console.log("Raw price from API:", rawPrice);
    console.log("Base price after parsing:", basePrice);
    console.log(
      "Has all_product_variations?",
      !!productApiData.all_product_variations,
    );
    console.log(
      "all_product_variations keys count:",
      productApiData.all_product_variations
        ? Object.keys(productApiData.all_product_variations).length
        : 0,
    );
    console.log(
      "Has product_variations?",
      !!productApiData.product_variations,
    );
    console.log("Number of options:", variantsData.options.length);
    console.log("Options:", JSON.stringify(variantsData.options, null, 2));
    console.log("Number of variants:", variantsData.variants.length);
    console.log(
      "First 3 variants:",
      JSON.stringify(variantsData.variants.slice(0, 3), null, 2),
    );
    console.log("Color image map keys:", Object.keys(variantsData.variantImages));
    console.log(
      "Color image map:",
      JSON.stringify(variantsData.variantImages, null, 2),
    );

    // Transform API response to our format
    // Support both old and new API field structures
    const productData: ScrapedProduct = {
      asin: parentAsin || apiData.asin,
      title: productApiData.title || (productApiData as any).product_title || "Untitled Product",
      description: formatDescription(productApiData),
      price: basePrice,
      currency: productApiData.price?.currency || "USD",
      images: productApiData.images?.map((img: any) => img.link) ||
              (productApiData as any).product_photos ||
              [(productApiData as any).product_photo || productApiData.main_image?.link || ""],
      options: variantsData.options,
      variants: variantsData.variants.map((variant) => ({
        ...variant,
        price: variant.price || basePrice,
      })),
      amazonUrl: productApiData.link || (productApiData as any).product_url,
      specifications: productApiData.product_information,
      bulletPoints: productApiData.feature_bullets || (productApiData as any).about_product,
      rating: productApiData.rating || (productApiData as any).product_star_rating,
      ratingsTotal: productApiData.ratings_total || (productApiData as any).product_num_ratings,
      categories: productApiData.categories?.map((cat: any) => cat.name) || [(productApiData as any).category],
      isPrime: productApiData.is_prime,
      isAmazonChoice: productApiData.is_amazon_choice,
      availability: productApiData.availability?.status || (productApiData as any).product_availability,
    };

    return {
      success: true,
      data: productData,
    };
  } catch (error) {
    console.error("Error fetching Amazon product:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Amazon product data",
    };
  }
}

/**
 * Format description from API data
 */
function formatDescription(apiData: AmazonProductData): string {
  // Try both old and new API field names
  let description = apiData.description || (apiData as any).product_description || "";

  // If no main description, use feature_bullets or about_product
  if (!description) {
    const bullets = apiData.feature_bullets || (apiData as any).about_product;
    if (bullets && bullets.length > 0) {
      description = bullets.join("\n");
    }
  }

  // Add customers_say if available (old API format)
  if ((apiData as any).customers_say) {
    description += "\n\n" + (apiData as any).customers_say;
  }

  return description || "No description available";
}

/**
 * Format variants from API data
 * Uses all_product_variations for complete combinations, or builds from product_variations
 */
function formatVariants(apiData: AmazonProductData): VariantsData {
  const allVariations = apiData.all_product_variations;
  const productVariations = apiData.product_variations;

  // Method 1: Use all_product_variations if available (most accurate)
  // Try both new format (with .data array) and old format (direct object with ASIN keys)
  if (allVariations && typeof allVariations === "object") {
    // New format: { data: [{asin, dimensions, ...}] }
    if (allVariations.data && Array.isArray(allVariations.data)) {
      return formatFromAllProductVariations(allVariations, productVariations);
    }
    // Old format: { "B08N5WRWNW": {color: "Red", size: "Large"}, ... }
    if (Object.keys(allVariations).length > 0 && !allVariations.data) {
      return formatFromAllProductVariationsOldFormat(allVariations as any, productVariations);
    }
  }

  // Method 2: Build from product_variations (fallback)
  if (productVariations && (Array.isArray(productVariations) || typeof productVariations === "object")) {
    return formatFromProductVariations(productVariations);
  }

  return { options: [], variants: [], variantImages: {} };
}

/**
 * Format using all_product_variations (preferred method)
 */
function formatFromAllProductVariations(
  allVariations: NonNullable<AmazonProductData["all_product_variations"]>,
  productVariations?: AmazonProductData["product_variations"],
): VariantsData {
  // Build image map from data
  const colorImageMap: Record<string, string> = {};

  if (allVariations.data) {
    allVariations.data.forEach((variantData) => {
      const colorKey = Object.keys(variantData.dimensions).find(
        (key) => key.toLowerCase() === "color" || key.toLowerCase() === "colour"
      );

      if (colorKey && variantData.images && variantData.images.length > 0) {
        const colorValue = variantData.dimensions[colorKey];
        colorImageMap[colorValue] = variantData.images[0].link;
      }
    });
  }

  // Build availability map
  const availabilityMap: Record<string, boolean> = {};
  if (allVariations.data) {
    allVariations.data.forEach((variantData) => {
      availabilityMap[variantData.asin] =
        variantData.availability?.status?.toLowerCase() !== "unavailable";
    });
  }

  const optionsMap = new Map<string, Set<string>>();
  const variants: ProductVariant[] = [];

  // Process all_product_variations to get complete combinations
  if (allVariations.data) {
    allVariations.data.forEach((variantData) => {
      // Skip unavailable variants
      if (availabilityMap[variantData.asin] === false) {
        return;
      }

      const options: Record<string, string> = {};

      // Build variant object with all options
      Object.entries(variantData.dimensions).forEach(([key, value]) => {
        const capitalizedName = key.charAt(0).toUpperCase() + key.slice(1);
        options[capitalizedName] = value;

        // Collect option names and values
        if (!optionsMap.has(capitalizedName)) {
          optionsMap.set(capitalizedName, new Set());
        }
        optionsMap.get(capitalizedName)!.add(value);
      });

      // Find image for this variant
      let image: string | undefined;
      const colorKey = Object.keys(options).find(
        (key) => key.toLowerCase() === "color"
      );
      if (colorKey && colorImageMap[options[colorKey]]) {
        image = colorImageMap[options[colorKey]];
      } else if (variantData.images && variantData.images.length > 0) {
        image = variantData.images[0].link;
      }

      variants.push({
        asin: variantData.asin,
        options,
        price: variantData.price?.current_price
          ? parsePrice(variantData.price.current_price)
          : undefined,
        image,
        available: availabilityMap[variantData.asin] !== false,
      });
    });
  }

  // Convert options map to array format for Shopify
  const options: ProductOption[] = Array.from(optionsMap.entries()).map(
    ([name, valuesSet]) => ({
      name: name,
      values: Array.from(valuesSet),
    }),
  );

  return {
    options,
    variants,
    variantImages: colorImageMap,
  };
}

/**
 * Format using all_product_variations in old format (JS version format)
 * Old format: { "ASIN1": {color: "Red", size: "Large"}, "ASIN2": {...} }
 */
function formatFromAllProductVariationsOldFormat(
  allVariations: Record<string, any>,
  productVariations?: AmazonProductData["product_variations"],
): VariantsData {
  // Build image map from product_variations color array
  const colorImageMap: Record<string, string> = {};
  if (productVariations && typeof productVariations === 'object') {
    const colorArray = (productVariations as any).color;
    if (Array.isArray(colorArray)) {
      colorArray.forEach((colorVariant: any) => {
        if (colorVariant.photo) {
          colorImageMap[colorVariant.value] = colorVariant.photo;
        }
      });
    }
  }

  // Build availability map from product_variations
  const availabilityMap: Record<string, boolean> = {};
  if (productVariations && typeof productVariations === 'object') {
    Object.values(productVariations).forEach((optionArray: any) => {
      if (Array.isArray(optionArray)) {
        optionArray.forEach((option: any) => {
          if (option.asin) {
            availabilityMap[option.asin] = option.is_available ?? true;
          }
        });
      }
    });
  }

  const optionsMap = new Map<string, Set<string>>();
  const variants: ProductVariant[] = [];

  // Process all_product_variations to get complete combinations
  Object.entries(allVariations).forEach(([asin, variantData]) => {
    // Skip unavailable variants
    if (availabilityMap[asin] === false) {
      return;
    }

    const options: Record<string, string> = {};

    // Build variant object with all options
    Object.entries(variantData).forEach(([key, value]) => {
      const capitalizedName = key.charAt(0).toUpperCase() + key.slice(1);
      options[capitalizedName] = String(value);

      // Collect option names and values
      if (!optionsMap.has(capitalizedName)) {
        optionsMap.set(capitalizedName, new Set());
      }
      optionsMap.get(capitalizedName)!.add(String(value));
    });

    // Find image for this variant
    let image: string | undefined;
    const colorKey = Object.keys(options).find(
      (key) => key.toLowerCase() === "color"
    );
    if (colorKey && colorImageMap[options[colorKey]]) {
      image = colorImageMap[options[colorKey]];
    }

    variants.push({
      asin,
      options,
      image,
      available: availabilityMap[asin] ?? true,
    });
  });

  // Convert options map to array format for Shopify
  const options: ProductOption[] = Array.from(optionsMap.entries()).map(
    ([name, valuesSet]) => ({
      name: name,
      values: Array.from(valuesSet),
    }),
  );

  return {
    options,
    variants,
    variantImages: colorImageMap,
  };
}

/**
 * Format from product_variations (fallback when all_product_variations is not available)
 */
function formatFromProductVariations(
  productVariations: NonNullable<AmazonProductData["product_variations"]>,
): VariantsData {
  const variantsByAsin: Record<string, ProductVariant> = {};
  const colorImageMap: Record<string, string> = {};
  const availabilityMap: Record<string, boolean> = {};

  // Handle both array format and object format
  if (Array.isArray(productVariations)) {
    // Array format (new API)
    productVariations.forEach((variation) => {
      processVariation(variation, variantsByAsin, colorImageMap, availabilityMap);
    });
  } else if (typeof productVariations === 'object') {
    // Object format (old API): { color: [{...}], size: [{...}] }
    Object.entries(productVariations).forEach(([optionName, optionValues]) => {
      if (!Array.isArray(optionValues)) return;

      const capitalizedName = optionName.charAt(0).toUpperCase() + optionName.slice(1);

      optionValues.forEach((option: any) => {
        const asin = option.asin;
        if (!asin) return;

        // Initialize variant for this ASIN if not exists
        if (!variantsByAsin[asin]) {
          variantsByAsin[asin] = {
            asin,
            options: {},
            available: true,
          };
        }

        // Add this option to the variant
        variantsByAsin[asin].options[capitalizedName] = option.value;

        // Store availability
        if (option.is_available === false) {
          availabilityMap[asin] = false;
          variantsByAsin[asin].available = false;
        }

        // Store image for color variants
        if (optionName === 'color' && option.photo) {
          colorImageMap[option.value] = option.photo;
          variantsByAsin[asin].image = option.photo;
        }

        // Store price
        if (option.price?.current_price) {
          variantsByAsin[asin].price = parsePrice(option.price.current_price);
        }
      });
    });
  }

  // Filter out unavailable variants
  const availableVariants = Object.values(variantsByAsin).filter(
    (variant) => availabilityMap[variant.asin] !== false,
  );

  // Extract unique options from available variants
  const optionsMap = new Map<string, Set<string>>();
  availableVariants.forEach((variant) => {
    Object.entries(variant.options).forEach(([key, value]) => {
      if (!optionsMap.has(key)) {
        optionsMap.set(key, new Set());
      }
      optionsMap.get(key)!.add(value);
    });
  });

  const options: ProductOption[] = Array.from(optionsMap.entries()).map(
    ([name, valuesSet]) => ({
      name: name,
      values: Array.from(valuesSet),
    }),
  );

  return {
    options,
    variants: availableVariants,
    variantImages: colorImageMap,
  };
}

/**
 * Helper to process a single variation (for array format)
 */
function processVariation(
  variation: any,
  variantsByAsin: Record<string, ProductVariant>,
  colorImageMap: Record<string, string>,
  availabilityMap: Record<string, boolean>,
): void {
    const asin = variation.asin;
    if (!asin) return;

    // Initialize variant for this ASIN if not exists
    if (!variantsByAsin[asin]) {
      variantsByAsin[asin] = {
        asin,
        options: {},
        available: true,
      };
    }

    // Add title as variant option if available
    if (variation.title) {
      variantsByAsin[asin].options.Title = variation.title;
    }

    // Store availability
    if (variation.availability?.status?.toLowerCase() === "unavailable") {
      availabilityMap[asin] = false;
      variantsByAsin[asin].available = false;
    }

    // Store image
    if (variation.images && variation.images.length > 0) {
      variantsByAsin[asin].image = variation.images[0].link;
      if (variation.title) {
        colorImageMap[variation.title] = variation.images[0].link;
      }
    }

    // Store price
    if (variation.price?.current_price) {
      variantsByAsin[asin].price = parsePrice(variation.price.current_price);
    }
}

// Old implementation commented out - keeping for reference
/*
function formatFromProductVariationsOld(
  productVariations: NonNullable<AmazonProductData["product_variations"]>,
): VariantsData {
  const variantsByAsin: Record<string, ProductVariant> = {};
  const colorImageMap: Record<string, string> = {};
  const availabilityMap: Record<string, boolean> = {};

  // Process each variation
  if (Array.isArray(productVariations)) {
    productVariations.forEach((variation) => {
    const asin = variation.asin;
    if (!asin) return;

    // Initialize variant for this ASIN if not exists
    if (!variantsByAsin[asin]) {
      variantsByAsin[asin] = {
        asin,
        options: {},
        available: true,
      };
    }

    // Add title as variant option if available
    if (variation.title) {
      variantsByAsin[asin].options.Title = variation.title;
    }

    // Store availability
    if (variation.availability?.status?.toLowerCase() === "unavailable") {
      availabilityMap[asin] = false;
      variantsByAsin[asin].available = false;
    }

    // Store image
    if (variation.images && variation.images.length > 0) {
      variantsByAsin[asin].image = variation.images[0].link;
      if (variation.title) {
        colorImageMap[variation.title] = variation.images[0].link;
      }
    }

    // Store price
    if (variation.price?.current_price) {
      variantsByAsin[asin].price = parsePrice(variation.price.current_price);
    }
  });

  // Filter out unavailable variants
  const availableVariants = Object.values(variantsByAsin).filter(
    (variant) => availabilityMap[variant.asin] !== false,
  );

  // Extract unique options from available variants
  const optionsMap = new Map<string, Set<string>>();
  availableVariants.forEach((variant) => {
    Object.entries(variant.options).forEach(([key, value]) => {
      if (!optionsMap.has(key)) {
        optionsMap.set(key, new Set());
      }
      optionsMap.get(key)!.add(value);
    });
  });

  const options: ProductOption[] = Array.from(optionsMap.entries()).map(
    ([name, valuesSet]) => ({
      name: name,
      values: Array.from(valuesSet),
    }),
  );

  return {
    options,
    variants: availableVariants,
    variantImages: colorImageMap,
  };
}

/**
 * Extract country code from Amazon URL
 */
function extractCountryFromUrl(url: string): string {
  const countryMap: Record<string, string> = {
    "amazon.com": "US",
    "amazon.co.uk": "GB",
    "amazon.de": "DE",
    "amazon.fr": "FR",
    "amazon.it": "IT",
    "amazon.es": "ES",
    "amazon.ca": "CA",
    "amazon.co.jp": "JP",
    "amazon.in": "IN",
    "amazon.com.mx": "MX",
    "amazon.com.br": "BR",
    "amazon.com.au": "AU",
  };

  for (const [domain, code] of Object.entries(countryMap)) {
    if (url.includes(domain)) {
      return code;
    }
  }

  return "US"; // Default to US
}

/**
 * Extract ASIN from Amazon URL
 */
function extractAsin(url: string): string | null {
  // Amazon ASIN is typically 10 characters alphanumeric
  const asinMatch = url.match(
    /\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/i,
  );
  return asinMatch ? asinMatch[1] || asinMatch[2] : null;
}

/**
 * Add affiliate tag to Amazon URL
 * @param url - Original Amazon URL
 * @param affiliateId - Amazon affiliate ID
 * @returns URL with affiliate tag
 */
export function addAffiliateTag(url: string, affiliateId: string): string {
  if (!affiliateId) return url;

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("tag", affiliateId);
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, append tag manually
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}tag=${affiliateId}`;
  }
}

/**
 * Create a scraper error with code
 */
function createScraperError(
  message: string,
  code: AmazonScraperErrorType["code"],
): Error {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}
