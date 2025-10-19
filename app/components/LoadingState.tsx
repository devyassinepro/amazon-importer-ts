/**
 * LoadingState Component
 * Shows skeleton loading state
 */

interface LoadingStateProps {
  variant?: "text" | "image" | "product";
  count?: number;
}

export default function LoadingState({ variant = "text", count = 3 }: LoadingStateProps) {
  if (variant === "text") {
    return (
      <s-stack direction="block" gap="base">
        {Array.from({ length: count }).map((_, idx) => (
          <s-skeleton-text key={idx} lines={1} />
        ))}
      </s-stack>
    );
  }

  if (variant === "image") {
    return (
      <s-stack direction="inline" gap="base">
        {Array.from({ length: count }).map((_, idx) => (
          <s-box
            key={idx}
            style={{
              width: "120px",
              height: "120px",
              backgroundColor: "#f4f6f8",
              borderRadius: "8px",
            }}
          />
        ))}
      </s-stack>
    );
  }

  if (variant === "product") {
    return (
      <s-stack direction="block" gap="base">
        <s-skeleton-text lines={1} />
        <s-stack direction="inline" gap="base">
          <s-box
            style={{
              width: "120px",
              height: "120px",
              backgroundColor: "#f4f6f8",
              borderRadius: "8px",
            }}
          />
          <s-box
            style={{
              width: "120px",
              height: "120px",
              backgroundColor: "#f4f6f8",
              borderRadius: "8px",
            }}
          />
          <s-box
            style={{
              width: "120px",
              height: "120px",
              backgroundColor: "#f4f6f8",
              borderRadius: "8px",
            }}
          />
        </s-stack>
        <s-skeleton-text lines={4} />
      </s-stack>
    );
  }

  return null;
}
