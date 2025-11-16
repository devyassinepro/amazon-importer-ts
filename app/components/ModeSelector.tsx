/**
 * ModeSelector Component
 * Allows user to choose between Affiliate and Dropshipping modes
 */

import type { ImportMode } from "~/types";

interface ModeSelectorProps {
  selected: ImportMode;
  onChange: (mode: ImportMode) => void;
  originalPrice: number;
  buttonText: string;
  affiliateAllowed?: boolean;
  currentPlan?: string;
}

export default function ModeSelector({
  selected,
  onChange,
  originalPrice,
  buttonText,
  affiliateAllowed = true,
  currentPlan = "FREE",
}: ModeSelectorProps) {
  return (
    <s-stack direction="block" gap="base">
      {/* Affiliate Mode */}
      <s-box
        padding="base"
        borderWidth="base"
        borderRadius="base"
        style={{
          borderColor: selected === "AFFILIATE" ? "#008060" : "#e1e3e5",
          backgroundColor: selected === "AFFILIATE" ? "#f6f6f7" : affiliateAllowed ? "transparent" : "#f9f9f9",
          cursor: affiliateAllowed ? "pointer" : "not-allowed",
          opacity: affiliateAllowed ? 1 : 0.6,
          position: "relative",
        }}
        onClick={() => affiliateAllowed && onChange("AFFILIATE")}
      >
        <s-stack direction="block" gap="small">
          <s-stack direction="inline" gap="small" style={{ alignItems: "center" }}>
            <input
              type="radio"
              name="import-mode"
              value="AFFILIATE"
              checked={selected === "AFFILIATE"}
              onChange={() => affiliateAllowed && onChange("AFFILIATE")}
              disabled={!affiliateAllowed}
              style={{ marginTop: "4px" }}
            />
            <s-text weight="semibold" size="large">
              🟢 Affiliate Mode
            </s-text>
            {!affiliateAllowed && (
              <span
                style={{
                  backgroundColor: "#FFA500",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginLeft: "8px",
                }}
              >
                ⭐ Upgrade Required
              </span>
            )}
          </s-stack>

          <s-paragraph tone="subdued" size="small">
            Keep original Amazon price. Add "{buttonText}" button to product page. Earn
            commissions through your affiliate ID.
          </s-paragraph>

          {!affiliateAllowed && (
            <s-banner tone="warning">
              <s-stack direction="block" gap="small">
                <s-text weight="semibold">
                  🔒 Affiliate Mode is only available on BASIC plan and above
                </s-text>
                <s-text>
                  Current plan: <strong>{currentPlan}</strong>
                </s-text>
                <s-text>
                  Upgrade to BASIC ($4.99/mo) or higher to unlock Affiliate Mode and earn commissions!
                </s-text>
                <s-link href="/app/billing" style={{ fontWeight: "600", color: "#008060" }}>
                  → View Pricing Plans
                </s-link>
              </s-stack>
            </s-banner>
          )}

          {selected === "AFFILIATE" && affiliateAllowed && (
            <s-banner tone="info">
              <s-stack direction="block" gap="small">
                <s-text>
                  <strong>Final Price:</strong> ${originalPrice?.toFixed(2)} (no
                  markup)
                </s-text>
                <s-text>
                  A "{buttonText}" button will be added after the "Buy It Now"
                  button on your product page.
                </s-text>
              </s-stack>
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
          borderColor: selected === "DROPSHIPPING" ? "#008060" : "#e1e3e5",
          backgroundColor:
            selected === "DROPSHIPPING" ? "#f6f6f7" : "transparent",
          cursor: "pointer",
        }}
        onClick={() => onChange("DROPSHIPPING")}
      >
        <s-stack direction="block" gap="small">
          <s-stack direction="inline" gap="small">
            <input
              type="radio"
              name="import-mode"
              value="DROPSHIPPING"
              checked={selected === "DROPSHIPPING"}
              onChange={() => onChange("DROPSHIPPING")}
              style={{ marginTop: "4px" }}
            />
            <s-text weight="semibold" size="large">
              🛒 Dropshipping Mode
            </s-text>
          </s-stack>

          <s-paragraph tone="subdued" size="small">
            Sell at your own price. No Amazon button. Perfect for traditional
            dropshipping.
          </s-paragraph>
        </s-stack>
      </s-box>
    </s-stack>
  );
}
