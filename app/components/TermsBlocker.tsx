/**
 * TermsBlocker Component
 * Blocks the UI until user accepts terms
 * Uses inline overlay instead of modal for better compatibility
 */

interface TermsBlockerProps {
  show: boolean;
  onAccept: () => void;
}

export default function TermsBlocker({ show, onAccept }: TermsBlockerProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e1e3e5",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "600",
              color: "#202223",
            }}
          >
           Amazon Importer - Terms & Conditions
          </h2>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          <s-stack direction="block" gap="base">
          
            {/* Introduction */}
            <s-stack direction="block" gap="small">
              <s-text weight="semibold" size="large">
              By using Amazon Importer, you agree to the following terms and conditions:
              </s-text>
              <s-paragraph tone="subdued">
                 <s-unordered-list>
                  <s-list-item>
                   You confirm that you have the necessary rights to import and sell products using this app.
                  </s-list-item>
                  <s-list-item>
                   Importing copyrighted or trademarked products without authorization is prohibited.
                  </s-list-item>
                  <s-list-item>
                   You are solely responsible for ensuring compliance with Shopify’s Acceptable Use Policy.
                  </s-list-item>
                  <s-list-item>
                   Any misuse of this app may result in account suspension or legal action.
                  </s-list-item>
                </s-unordered-list>
              </s-paragraph>
            </s-stack>

            {/* Acceptance Section */}
            <s-banner tone="info">
              <s-stack direction="block" gap="small">
                <s-text weight="semibold">
                I have read, understood, and agree to the Terms & Conditions.
                </s-text>
              </s-stack>
            </s-banner>
          </s-stack>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e1e3e5",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <s-button variant="primary" onClick={onAccept}>
            I Accept Terms & Conditions
          </s-button>
        </div>
      </div>
    </div>
  );
}
