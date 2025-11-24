import React from "react";
import { X, Calendar, User, Layers, Clock, CheckCircle, XCircle } from "lucide-react";
import ProgressBar from "./ProgressBar";

const JobDetailsModal = ({ job, onClose, avgTime, elapsedTime }) => {
  // formatDate helper (defensive)
  const formatDate = (dateString) => {
    const raw = dateString || "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
  };

// calculateDuration uses normalized startDate/endDate (falls back gracefully)
  const calculateDuration = () => {
    const startRaw = job.startDate || job.startTime || job.uploadTime;
    const endRaw = job.endDate || job.endTime;
    if (!startRaw) return "Unknown";
    const start = new Date(startRaw);
    const end = endRaw ? new Date(endRaw) : new Date();
    if (Number.isNaN(start.getTime())) return "Unknown";

    const diff = end - start;
    if (!Number.isFinite(diff) || diff < 0) return job.executionTime || "0m 0s";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case "SUCCESS":
        return <CheckCircle style={{ width: 24, height: 24, color: "#10b981" }} />;
      case "FAILED":
        return <XCircle style={{ width: 24, height: 24, color: "#ef4444" }} />;
      default:
        return null;
    }
  };

  const getStatusStyles = () => {
    const base = {
      padding: "4px 10px",
      borderRadius: 9999,
      textTransform: "uppercase",
      fontSize: 12,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid transparent",
      minWidth: 90,
      whiteSpace: 'nowrap',
    };
    switch (job.status) {
      case "SUCCESS":
        return { ...base, background: "rgba(16,185,129,0.2)", color: "#10b981", borderColor: "rgba(16,185,129,0.5)" };
      case "IN_PROGRESS":
        return { ...base, background: "rgba(59,130,246,0.2)", color: "#3b82f6", borderColor: "rgba(59,130,246,0.5)" };
      case "In Queue":
        return { ...base, background: "rgba(245,158,11,0.2)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.5)" };
      case "FAILED":
        return { ...base, background: "rgba(239,68,68,0.2)", color: "#ef4444", borderColor: "rgba(239,68,68,0.5)" };
      case "CANCELLED":
        return { ...base, background: "rgba(107,114,128,0.2)", color: "#9ca3af", borderColor: "rgba(107,114,128,0.5)" };
      default:
        return { ...base, background: "rgba(107,114,128,0.2)", color: "#9ca3af", borderColor: "rgba(107,114,128,0.5)" };
    }
  };

  const modalContainer = {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.3s ease",
  };

  const modalBox = {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    width: "100%",
    maxWidth: 800,
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const sectionBox = {
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: 16,
  };

  const header = {
    position: "sticky",
    top: 0,
    background: "#1a1a1a",
    borderBottom: "1px solid #2a2a2a",
    padding: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  };

  const closeButton = {
    padding: 8,
    color: "#9ca3af",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const closeHover = {
    color: "white",
    background: "#2a2a2a",
  };

  return (
    <div style={modalContainer}>
      <div style={modalBox} className="custom-scrollbar">
        {/* Header */}
        <div style={header}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {getStatusIcon()}
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "white" }}>{job.jobName}</h2>
            </div>
            <span style={getStatusStyles()}>{job.status}</span>
          </div>
          <button
            style={closeButton}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, closeHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, closeButton)}
            onClick={onClose}
          >
            <X style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Progress Section */}
          <div style={sectionBox}>
            <ProgressBar
              progress={job.progress}
              status={job.status}
              color={getStatusStyles().color}
              avgTime={avgTime ?? job.avgTime}
              elapsedTime={elapsedTime ?? 0}
            />
            {job.status === "IN_PROGRESS" && typeof job.avgTime === "number" && job.avgTime > 0 && (
              <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 500, marginTop: 8, display: 'block' }}>{`Avg: ${Math.round(job.avgTime / 60)} min`}</span>
            )}
          </div>

          {/* Job Information */}
          <div style={{ ...sectionBox, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "white" }}>Job Information</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { icon: <Layers style={{ width: 20, height: 20, color: "#9ca3af" }} />, label: "Batch Name", value: job.batchName },
                { icon: <User style={{ width: 20, height: 20, color: "#9ca3af" }} />, label: "Executed By", value: job.userName || job.username || "—" },
                { icon: <Calendar style={{ width: 20, height: 20, color: "#9ca3af" }} />, label: "Start Time", value: formatDate(job.startDate || job.startTime) },
                job.endDate || job.endTime ? { icon: <Calendar style={{ width: 20, height: 20, color: "#9ca3af" }} />, label: "End Time", value: formatDate(job.endDate || job.endTime) } : null,
                { icon: <Clock style={{ width: 20, height: 20, color: "#9ca3af" }} />, label: "Duration", value: calculateDuration() },
                { icon: <div style={{ color: "#9ca3af", fontWeight: "bold" }}>#</div>, label: "Job ID", value: job.id },
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {item.icon}
                    <div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Additional Details */}
          <div style={sectionBox}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "white", marginBottom: 12 }}>Additional Details</h3>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 8 }}>
              {`This job was run by ${job.userName || job.username || "Unknown user"} in the ${job.environment || "Unknown"} environment and it ran for ${calculateDuration()}.`}
            </p>
            {job.batchName || job.batchId ? (
              <p style={{ fontSize: 14, color: "#9ca3af" }}>
                {`Batch: ${job.batchName || job.batchId}`}
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#1a1a1a",
            borderTop: "1px solid #2a2a2a",
            padding: 24,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              background: "#3b82f6",
              border: "none",
              borderRadius: 8,
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
          >
            Close
          </button>
        </div>
      </div>

      {/* Animations + Scrollbar */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
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

export default JobDetailsModal;
