/**
 * PricingCalculator Component
 * Calculates final price with markup for dropshipping mode
 */

import type { PricingMode } from "~/types";

interface PricingCalculatorProps {
  originalPrice: number;
  markupType: PricingMode;
  markupValue: number;
  onMarkupTypeChange: (type: PricingMode) => void;
  onMarkupValueChange: (value: number) => void;
}

export default function PricingCalculator({
  originalPrice,
  markupType,
  markupValue,
  onMarkupTypeChange,
  onMarkupValueChange,
}: PricingCalculatorProps) {
  const finalPrice =
    markupType === "MULTIPLIER"
      ? originalPrice * markupValue
      : originalPrice + markupValue;

  return (
    <s-stack direction="block" gap="base" style={{ marginTop: "16px" }}>
      <s-text weight="semibold">Price Markup Configuration:</s-text>

      <s-stack direction="inline" gap="base">
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="radio"
            name="markup-type"
            value="FIXED"
            checked={markupType === "FIXED"}
            onChange={() => onMarkupTypeChange("FIXED")}
          />
          <s-text>Fixed Amount ($)</s-text>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="radio"
            name="markup-type"
            value="MULTIPLIER"
            checked={markupType === "MULTIPLIER"}
            onChange={() => onMarkupTypeChange("MULTIPLIER")}
          />
          <s-text>Multiplier (x)</s-text>
        </label>
      </s-stack>

      <s-text-field
        type="number"
        value={markupValue.toString()}
        onChange={(e: any) => onMarkupValueChange(parseFloat(e.target.value) || 0)}
        label={markupType === "FIXED" ? "Markup Amount ($)" : "Price Multiplier"}
        helptext={
          markupType === "FIXED"
            ? "Fixed amount to add to the original price"
            : "Multiply original price (1.0 = no markup, 1.5 = 50% markup, 2.0 = 100% markup)"
        }
        min="0"
        step={markupType === "FIXED" ? "0.01" : "0.1"}
      ></s-text-field>

      <s-banner tone="success">
        <s-stack direction="block" gap="small">
          <s-text>
            <strong>Original Price:</strong> ${originalPrice?.toFixed(2)}
          </s-text>
          <s-text>
            <strong>Markup:</strong>{" "}
            {markupType === "FIXED"
              ? `$${markupValue.toFixed(2)}`
              : `${markupValue}x`}
          </s-text>
          <s-text size="large" weight="semibold">
            <strong>Final Price:</strong> ${finalPrice.toFixed(2)}
          </s-text>
          <s-text tone="subdued" size="small">
            Profit margin: ${(finalPrice - originalPrice).toFixed(2)} (
            {(((finalPrice - originalPrice) / originalPrice) * 100).toFixed(1)}
            %)
          </s-text>
        </s-stack>
      </s-banner>
    </s-stack>
  );
}
