import React from "react";
import ProgressBar from "./ProgressBar";
import { ChevronRight } from "lucide-react";

const JobCard = ({ job, onClick, avgTime, elapsedTime }) => {
  const getStatusStyle = () => {
    switch (job.status) {
      case "SUCCESS":
        return { background: "rgba(16,185,129,0.2)", color: "#10b981", borderColor: "rgba(16,185,129,0.5)" };
      case "IN_PROGRESS":
        return { background: "rgba(59,130,246,0.2)", color: "#3b82f6", borderColor: "rgba(59,130,246,0.5)" };
      case "In Queue":
        return { background: "rgba(245,158,11,0.2)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.5)" };
      case "FAILED":
        return { background: "rgba(239,68,68,0.2)", color: "#ef4444", borderColor: "rgba(239,68,68,0.5)" };
      case "CANCELLED":
        return { background: "rgba(107,114,128,0.2)", color: "#9ca3af", borderColor: "rgba(107,114,128,0.5)" };
      default:
        return { background: "rgba(107,114,128,0.2)", color: "#9ca3af", borderColor: "rgba(107,114,128,0.5)" };
    }
  };

  const formatDate = (dateStringOrObj) => {
    const raw = dateStringOrObj || "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "—"; // nice fallback in UI
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };


  const styles = {
    container: {
      backgroundColor: "#1a1a1a",
      border: "1px solid #2a2a2a",
      borderRadius: 8,
      padding: 16,
      transition: "all 0.3s ease",
      cursor: "pointer",
      marginBottom: "3%"
    },
    containerHover: {
      borderColor: "rgba(59,130,246,0.5)",
      transform: "scale(1.02)",
      boxShadow: "0 4px 10px rgba(59,130,246,0.1)",
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
    info: { flex: 1, minWidth: 0 },
    title: {
      fontSize: "1rem",
      fontWeight: 700,
      color: "white",
      marginBottom: 4,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      transition: "color 0.3s ease",
    },
    subtitle: { fontSize: "0.75rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    statusWrap: { display: "flex", alignItems: "center", gap: 8, height: 32, justifyContent: 'center' },
    statusBadge: {
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 600,
      textTransform: "uppercase",
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "solid",
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 90,
    },
    chevron: { width: 16, height: 16, color: "#9ca3af", transition: "color 0.3s ease" },
    progress: { marginTop: 12 },
    progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    progressLabel: { fontSize: 10, color: "#9ca3af" },
    progressValue: { fontSize: 12, fontWeight: 600, color: "white" },
    footer: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid #2a2a2a",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12,
      color: "#9ca3af",
    },
    user: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    avgTime: { fontSize: 12, color: "#3b82f6", fontWeight: 500, marginLeft: 8, whiteSpace: 'nowrap' },
  };

  return (
    <div
      style={styles.container}
      onClick={onClick}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.containerHover)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.container)}
    >
      <div style={styles.header}>
        <div style={styles.info}>
          <h3 style={styles.title}>{job.jobName}</h3>
          <div style={styles.subtitle}>{job.batchName}</div>
        </div>
        <div style={styles.statusWrap}>
          <span style={{ ...styles.statusBadge, ...getStatusStyle() }}>{job.status}</span>
        </div>
      </div>

      <div style={styles.progress}>
        <ProgressBar
          progress={job.progress}
          status={job.status}
          color={getStatusStyle().color}
          avgTime={avgTime ?? job.avgTime}
          elapsedTime={elapsedTime ?? 0}
        />
        {job.status === "IN_PROGRESS" && typeof job.avgTime === "number" && job.avgTime > 0 && (
          <span style={styles.avgTime}>{`Avg: ${Math.round(job.avgTime / 60)} min`}</span>
        )}
      </div>

      <div style={styles.footer}>
        <span style={styles.user}>{job.userName}</span>
        <span>{formatDate(job.startDate).split(",")[0]}</span>
      </div>
    </div>
  );
};

export default JobCard;
