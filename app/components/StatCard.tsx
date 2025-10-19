/**
 * StatCard Component
 * Displays a statistic with icon, value, and label
 */

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  colorVariant?: "blue" | "green" | "yellow" | "purple" | "red";
  delay?: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({
  icon,
  value,
  label,
  colorVariant = "blue",
  delay = 0,
  trend,
}: StatCardProps) {
  const colors = {
    blue: { bg: "#e3f2fd", text: "#1976d2" },
    green: { bg: "#e8f5e9", text: "#388e3c" },
    yellow: { bg: "#fff9e6", text: "#f59e0b" },
    purple: { bg: "#f3e8ff", text: "#9333ea" },
    red: { bg: "#ffebee", text: "#d32f2f" },
  };

  const selectedColor = colors[colorVariant];

  return (
    <div
      className="stat-card"
      style={{
        animation: `fadeIn 0.5s ease ${delay}ms both`,
        background: selectedColor.bg,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        border: `1px solid ${selectedColor.text}20`,
      }}
    >
      <div style={{ fontSize: "32px" }}>{icon}</div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: selectedColor.text,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#6d7175",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      {trend && (
        <div
          style={{
            fontSize: "12px",
            color: trend.isPositive ? "#10b981" : "#6d7175",
          }}
        >
          {trend.value}
        </div>
      )}
    </div>
  );
}
