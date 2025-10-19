/**
 * EmptyState Component
 * Shows when there's no data to display
 */

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        background: "#fafbfb",
        borderRadius: "12px",
        border: "1px solid #e1e3e5",
      }}
    >
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>{icon}</div>
      <h3
        style={{
          fontSize: "20px",
          fontWeight: "600",
          color: "#202223",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "#6d7175",
          marginBottom: "24px",
          maxWidth: "400px",
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <s-button variant="primary" onClick={onAction}>
          {actionLabel}
        </s-button>
      )}
    </div>
  );
}
