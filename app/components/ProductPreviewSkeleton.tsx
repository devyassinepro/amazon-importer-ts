export function ProductPreviewSkeleton() {
  return (
    <s-section heading="Loading product...">
      <s-stack direction="block" gap="base">
        <s-skeleton-text lines={1} />

        <s-stack direction="inline" gap="base">
          <s-box
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "#f4f6f8",
              borderRadius: "8px",
            }}
          />
          <s-box
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "#f4f6f8",
              borderRadius: "8px",
            }}
          />
          <s-box
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "#f4f6f8",
              borderRadius: "8px",
            }}
          />
        </s-stack>

        <s-skeleton-text lines={4} />

        <s-stack direction="block" gap="small">
          <s-skeleton-text lines={1} />
          <s-skeleton-text lines={1} />
        </s-stack>
      </s-stack>
    </s-section>
  );
}
