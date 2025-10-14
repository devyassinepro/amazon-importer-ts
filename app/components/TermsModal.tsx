interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  if (!open) return null;

  return (
    <s-modal
      open={open}
      title="Terms of Importation"
      primaryAction="I Accept"
      onPrimaryAction={onAccept}
      secondaryAction="Cancel"
      onSecondaryAction={onClose}
      onClose={onClose}
    >
      <s-stack direction="block" gap="base">
        <s-paragraph>
          By using Amazon Importer, you agree to the following terms and
          conditions:
        </s-paragraph>

        <s-unordered-list>
          <s-list-item>
            You confirm that you have the necessary rights to import and sell
            products using this app.
          </s-list-item>
          <s-list-item>
            Importing copyrighted or trademarked products without authorization
            is strictly prohibited.
          </s-list-item>
          <s-list-item>
            You are solely responsible for ensuring compliance with Shopify's
            Acceptable Use Policy and all applicable laws.
          </s-list-item>
          <s-list-item>
            Amazon's Terms of Service must be respected. This includes proper
            use of product data and images.
          </s-list-item>
          <s-list-item>
            When using Affiliate Mode, you must comply with Amazon's Associates
            Program Operating Agreement.
          </s-list-item>
          <s-list-item>
            Any misuse of this app may result in account suspension or legal
            action.
          </s-list-item>
          <s-list-item>
            Price accuracy is your responsibility. Always verify prices before
            publishing products.
          </s-list-item>
        </s-unordered-list>

        <s-paragraph weight="semibold">
          By clicking "I Accept", you acknowledge that you have read and
          understood these terms.
        </s-paragraph>
      </s-stack>
    </s-modal>
  );
}
