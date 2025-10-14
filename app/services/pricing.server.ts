import type { PricingMode, PricingResult } from "~/types";

/**
 * Apply pricing markup to a price
 * @param originalPrice - Original price from Amazon
 * @param mode - "MULTIPLIER" or "FIXED"
 * @param value - Multiplier value (e.g., 1.5 for 50% markup) or fixed amount
 * @returns New price with markup applied
 */
export function applyPricingMarkup(
  originalPrice: number,
  mode: PricingMode,
  value: number,
): number {
  if (!originalPrice || originalPrice <= 0) {
    return originalPrice;
  }

  if (mode === "MULTIPLIER") {
    // Multiply the price (e.g., 1.5 = 50% increase, 2.0 = 100% increase)
    return parseFloat((originalPrice * value).toFixed(2));
  } else if (mode === "FIXED") {
    // Add fixed amount
    return parseFloat((originalPrice + value).toFixed(2));
  }

  return originalPrice;
}

/**
 * Calculate markup percentage for display
 * @param originalPrice - Original price
 * @param newPrice - Price after markup
 * @returns Percentage markup
 */
export function calculateMarkupPercentage(
  originalPrice: number,
  newPrice: number,
): number {
  if (!originalPrice || originalPrice <= 0) {
    return 0;
  }

  const markup = ((newPrice - originalPrice) / originalPrice) * 100;
  return parseFloat(markup.toFixed(2));
}

/**
 * Format price for display
 * @param price - Price to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
}

/**
 * Calculate complete pricing information
 * @param originalPrice - Original Amazon price
 * @param mode - Pricing mode (MULTIPLIER or FIXED)
 * @param value - Markup value
 * @returns Complete pricing result with all calculations
 */
export function calculatePricing(
  originalPrice: number,
  mode: PricingMode,
  value: number,
): PricingResult {
  const finalPrice = applyPricingMarkup(originalPrice, mode, value);
  const markup = finalPrice - originalPrice;
  const markupPercentage = calculateMarkupPercentage(originalPrice, finalPrice);

  return {
    originalPrice,
    finalPrice,
    markup,
    markupPercentage,
  };
}

/**
 * Validate pricing input
 * @param originalPrice - Original price
 * @param mode - Pricing mode
 * @param value - Markup value
 * @returns Validation result
 */
export function validatePricing(
  originalPrice: number,
  mode: PricingMode,
  value: number,
): { valid: boolean; error?: string } {
  if (originalPrice <= 0) {
    return { valid: false, error: "Original price must be greater than 0" };
  }

  if (mode === "MULTIPLIER" && value < 1) {
    return {
      valid: false,
      error: "Multiplier must be at least 1.0 (no markup)",
    };
  }

  if (mode === "FIXED" && value < 0) {
    return {
      valid: false,
      error: "Fixed markup cannot be negative",
    };
  }

  return { valid: true };
}
