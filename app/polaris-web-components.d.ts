// Type declarations for Shopify Polaris Web Components
declare namespace JSX {
  interface IntrinsicElements {
    "s-page": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      heading?: string;
      children?: React.ReactNode;
    };
    "s-section": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      heading?: string;
      slot?: string;
      children?: React.ReactNode;
    };
    "s-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      variant?: "primary" | "secondary" | "tertiary" | "plain";
      slot?: string;
      href?: string;
      loading?: boolean;
      disabled?: boolean;
      type?: string;
      children?: React.ReactNode;
    };
    "s-text-field": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      name?: string;
      label?: string;
      value?: string;
      type?: string;
      placeholder?: string;
      helptext?: string;
      details?: string;
      autocomplete?: string;
      error?: string;
      min?: string;
      max?: string;
      step?: string;
      disabled?: boolean;
      required?: boolean;
      children?: React.ReactNode;
    };
    "s-text": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      tone?: "auto" | "neutral" | "info" | "success" | "caution" | "warning" | "critical" | "subdued";
      size?: "small" | "medium" | "large";
      weight?: "regular" | "medium" | "semibold" | "bold";
      variant?: string;
      children?: React.ReactNode;
    };
    "s-paragraph": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      tone?: "auto" | "neutral" | "info" | "success" | "caution" | "warning" | "critical" | "subdued";
      size?: "small" | "medium" | "large";
      weight?: "regular" | "medium" | "semibold" | "bold";
      children?: React.ReactNode;
    };
    "s-heading": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      level?: "1" | "2" | "3" | "4" | "5" | "6";
      size?: "small" | "medium" | "large";
      children?: React.ReactNode;
    };
    "s-stack": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      direction?: "inline" | "block";
      gap?: "none" | "tight" | "base" | "loose" | "small";
      align?: "start" | "center" | "end" | "stretch";
      children?: React.ReactNode;
    };
    "s-box": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      padding?: "none" | "tight" | "base" | "loose";
      borderWidth?: "none" | "base";
      borderRadius?: "none" | "base";
      children?: React.ReactNode;
    };
    "s-banner": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      tone?: "info" | "success" | "warning" | "critical";
      children?: React.ReactNode;
    };
    "s-badge": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      tone?: "info" | "success" | "warning" | "critical" | "auto" | "neutral" | "caution" | "subdued";
      children?: React.ReactNode;
    };
    "s-select": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      value?: string;
      disabled?: boolean;
      helptext?: string;
      children?: React.ReactNode;
    };
    "s-checkbox": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      checked?: boolean;
      disabled?: boolean;
      children?: React.ReactNode;
    };
    "s-radio-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      checked?: boolean;
      disabled?: boolean;
      name?: string;
      value?: string;
      children?: React.ReactNode;
    };
    "s-skeleton-text": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      lines?: number;
      children?: React.ReactNode;
    };
    "s-link": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      href?: string;
      target?: string;
      children?: React.ReactNode;
    };
    "s-ordered-list": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      children?: React.ReactNode;
    };
    "s-unordered-list": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      children?: React.ReactNode;
    };
    "s-list-item": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      children?: React.ReactNode;
    };
    "s-modal": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      title?: string;
      open?: boolean;
      primaryAction?: string;
      secondaryAction?: string;
      onPrimaryAction?: () => void;
      onSecondaryAction?: () => void;
      onClose?: () => void;
      children?: React.ReactNode;
    };
    "s-app-nav": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      children?: React.ReactNode;
    };
    "s-divider": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      children?: React.ReactNode;
    };
  }
}
