/**
 * YouTubeModal Component
 * Modal pour afficher une vidéo YouTube explicative
 */

interface YouTubeModalProps {
  show: boolean;
  onClose: () => void;
  videoId: string; // YouTube video ID (e.g., "dQw4w9WgXcQ")
}

export default function YouTubeModal({ show, onClose, videoId }: YouTubeModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e1e3e5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f6f6f7",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "#202223",
            }}
          >
            📺 How to Use Amazon Importer
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "28px",
              cursor: "pointer",
              color: "#6d7175",
              padding: "0",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e1e3e5")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            ×
          </button>
        </div>

        {/* Video */}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "56.25%", // 16:9 aspect ratio
            height: 0,
            overflow: "hidden",
          }}
        >
          <iframe
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="Amazon Importer Tutorial"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #e1e3e5",
            display: "flex",
            justifyContent: "flex-end",
            background: "#f6f6f7",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#008060",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#006e52")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#008060")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
