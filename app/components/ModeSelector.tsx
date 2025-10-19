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
}

export default function ModeSelector({
  selected,
  onChange,
  originalPrice,
  buttonText,
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
          backgroundColor: selected === "AFFILIATE" ? "#f6f6f7" : "transparent",
          cursor: "pointer",
        }}
        onClick={() => onChange("AFFILIATE")}
      >
        <s-stack direction="block" gap="small">
          <s-stack direction="inline" gap="small">
            <input
              type="radio"
              name="import-mode"
              value="AFFILIATE"
              checked={selected === "AFFILIATE"}
              onChange={() => onChange("AFFILIATE")}
              style={{ marginTop: "4px" }}
            />
            <s-text weight="semibold" size="large">
              🟢 Affiliate Mode
            </s-text>
          </s-stack>

          <s-paragraph tone="subdued" size="small">
            Keep original Amazon price. Add "{buttonText}" button to product page. Earn
            commissions through your affiliate ID.
          </s-paragraph>

          {selected === "AFFILIATE" && (
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
