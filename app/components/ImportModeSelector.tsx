import { useState } from "react";
import type { ImportMode, PricingMode } from "~/types";

interface ImportModeSelectorProps {
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  originalPrice: number;
  finalPrice: number;
  markupType: PricingMode;
  onMarkupTypeChange: (type: PricingMode) => void;
  markupValue: number;
  onMarkupValueChange: (value: number) => void;
}

export function ImportModeSelector({
  mode,
  onModeChange,
  originalPrice,
  finalPrice,
  markupType,
  onMarkupTypeChange,
  markupValue,
  onMarkupValueChange,
}: ImportModeSelectorProps) {
  const calculateFinalPrice = () => {
    if (markupType === "MULTIPLIER") {
      return (originalPrice * markupValue).toFixed(2);
    } else {
      return (originalPrice + markupValue).toFixed(2);
    }
  };

  const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onMarkupValueChange(value);
  };

  return (
    <s-section heading="Import Mode">
      <s-paragraph tone="subdued">
        Choose how you want to sell this product
      </s-paragraph>

      <s-stack direction="block" gap="base">
        {/* Affiliate Mode */}
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          style={{
            borderColor: mode === "AFFILIATE" ? "var(--s-color-border-success)" : undefined,
            backgroundColor: mode === "AFFILIATE" ? "var(--s-color-bg-surface-secondary)" : undefined,
            cursor: "pointer",
          }}
          onClick={() => onModeChange("AFFILIATE")}
        >
          <s-stack direction="block" gap="base">
            <s-radio-button
              name="import-mode"
              value="AFFILIATE"
              checked={mode === "AFFILIATE"}
              onChange={() => onModeChange("AFFILIATE")}
            >
              <s-text weight="semibold">🟢 Affiliate Mode</s-text>
            </s-radio-button>

            <s-paragraph tone="subdued" size="small">
              Keep original Amazon price. Add "Buy on Amazon" button to product
              page. Earn commissions through your affiliate ID.
            </s-paragraph>

            {mode === "AFFILIATE" && (
              <s-banner tone="info">
                <s-paragraph>
                  <strong>Final Price:</strong> ${originalPrice.toFixed(2)} (no
                  markup)
                  <br />A "Buy on Amazon" button will be added after the "Buy It
                  Now" button on your product page.
                </s-paragraph>
              </s-banner>
            )}
          </s-stack>
        </s-box>

        {/* Dropshipping Mode */}
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          style={{
            borderColor: mode === "DROPSHIPPING" ? "var(--s-color-border-success)" : undefined,
            backgroundColor: mode === "DROPSHIPPING" ? "var(--s-color-bg-surface-secondary)" : undefined,
            cursor: "pointer",
          }}
          onClick={() => onModeChange("DROPSHIPPING")}
        >
          <s-stack direction="block" gap="base">
            <s-radio-button
              name="import-mode"
              value="DROPSHIPPING"
              checked={mode === "DROPSHIPPING"}
              onChange={() => onModeChange("DROPSHIPPING")}
            >
              <s-text weight="semibold">🛒 Dropshipping Mode</s-text>
            </s-radio-button>

            <s-paragraph tone="subdued" size="small">
              Sell at your own price. No Amazon button. Perfect for traditional
              dropshipping.
            </s-paragraph>

            {mode === "DROPSHIPPING" && (
              <s-stack direction="block" gap="base">
                <s-text weight="semibold">Price Markup</s-text>

                <s-stack direction="inline" gap="base">
                  <s-radio-button
                    name="markup-type"
                    value="FIXED"
                    checked={markupType === "FIXED"}
                    onChange={() => onMarkupTypeChange("FIXED")}
                  >
                    Fixed Amount
                  </s-radio-button>
                  <s-radio-button
                    name="markup-type"
                    value="MULTIPLIER"
                    checked={markupType === "MULTIPLIER"}
                    onChange={() => onMarkupTypeChange("MULTIPLIER")}
                  >
                    Multiplier
                  </s-radio-button>
                </s-stack>

                <s-text-field
                  type="number"
                  value={markupValue.toString()}
                  onChange={handleMarkupChange}
                  label={
                    markupType === "FIXED"
                      ? "Markup Amount ($)"
                      : "Price Multiplier (e.g., 1.5 for 50% markup)"
                  }
                  helptext={
                    markupType === "FIXED"
                      ? "Fixed amount to add to the original price"
                      : "Multiply original price (1.0 = no markup, 1.5 = 50% markup, 2.0 = 100% markup)"
                  }
                  min="0"
                  step={markupType === "FIXED" ? "0.01" : "0.1"}
                ></s-text-field>

                <s-banner tone="success">
                  <s-paragraph>
                    <strong>Original Price:</strong> $
                    {originalPrice.toFixed(2)}
                    <br />
                    <strong>Markup:</strong>{" "}
                    {markupType === "FIXED"
                      ? `$${markupValue.toFixed(2)}`
                      : `${markupValue}x`}
                    <br />
                    <strong>Final Price:</strong> ${calculateFinalPrice()}
                  </s-paragraph>
                </s-banner>
              </s-stack>
            )}
          </s-stack>
        </s-box>
      </s-stack>
    </s-section>
  );
}
