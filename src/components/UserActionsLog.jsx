import React from "react";
import { Activity, Clock } from "lucide-react";

const UserActionsLog = ({ actions }) => {
  const formatTimestamp = (timestamp) => {
    const raw = timestamp || timestamp === 0 ? timestamp : (timestamp || "");
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
  };


  const getActionColor = (action) => {
    const a = action.toLowerCase();
    if (a.includes("start") || a.includes("create")) return "#3b82f6"; // blue
    if (a.includes("complete") || a.includes("success")) return "#10b981"; // green
    if (a.includes("fail") || a.includes("error")) return "#ef4444"; // red
    if (a.includes("cancel") || a.includes("stop")) return "#9ca3af"; // gray
    return "#f59e0b"; // amber
  };

  const containerStyle = {
    background: "#1a1a1a",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #2a2a2a",
    color: "white",
    marginTop: "3%",
  };

  const scrollStyle = {
    maxHeight: "24rem",
    overflowY: "auto",
  };

  const cardBase = {
    background: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    border: "1px solid #2a2a2a",
    transition: "all 0.25s ease",
    transform: "translateY(0px)",
  };

  const timestampStyle = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#9ca3af",
  };

  const detailStyle = {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #2a2a2a",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <Activity size={20} color="white" />
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>User Actions Log</h2>
      </div>

      {/* Scrollable list */}
      <div style={scrollStyle} className="custom-scrollbar">
        {actions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7280" }}>
            No user actions recorded yet
          </div>
        ) : (
          actions.map((action) => {
            const color = getActionColor(action.action);
            return (
              <div
                key={action.id}
                style={{ ...cardBase }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1px solid ${color}`;
                  e.currentTarget.style.boxShadow = `0 4px 12px ${color}55`;
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = cardBase.border;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = cardBase.transform;
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "white" }}>{action.userName}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color }}>
                        {action.action}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#9ca3af" }}>
                      File Name : <span style={{ color: "#d1d5db" }}>{action.jobName}</span>
                    </div>
                  </div>
                  <div style={timestampStyle}>
                    <Clock size={12} />
                    <span>{formatTimestamp(action.timestamp)}</span>
                  </div>
                </div>

                {action.details && <div style={detailStyle}>{action.details}</div>}
              </div>
            );
          })
        )}
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a3a3a;
        }
      `}</style>
    </div>
  );
};

export default UserActionsLog;
