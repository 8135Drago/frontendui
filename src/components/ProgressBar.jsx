import React, { useEffect, useRef, useState } from "react";

const ProgressBar = ({ progress, status, color, avgTime, elapsedTime }) => {
  // Color logic unchanged
  const getColor = () => {
    if (color) return color;
    switch (status) {
      case "SUCCESS": return "#10b981";
      case "IN_PROGRESS": return "#3b82f6";
      case "In Queue": return "#f59e0b";
      case "FAILED": return "#ef4444";
      case "CANCELLED": return "#6b7280";
      default: return "#3b82f6";
    }
  };

  const [animatedProgress, setAnimatedProgress] = useState(() => {
    // If we have an explicit progress prop (e.g. 0..100) show it for non-IN_PROGRESS statuses
    if (status !== "IN_PROGRESS" && typeof progress === "number") return progress;
    // For IN_PROGRESS we'll compute below in effect using elapsedTime
    return 0;
  });
  const intervalRef = useRef();
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    // Clear any previous interval
    clearInterval(intervalRef.current);

    if (status === "IN_PROGRESS") {
      // seconds; fall back to 5 minutes if no avgTime
      const duration = Number.isFinite(avgTime) && avgTime > 0 ? avgTime : 300;
      const initialElapsed = Number.isFinite(elapsedTime) && elapsedTime >= 0 ? elapsedTime : 0;

      // compute initial percent (cap to 90% while running)
      const initialPercent = Math.min(90, Math.round((initialElapsed / duration) * 90));
      setAnimatedProgress(initialPercent);
      setOverdue(initialElapsed > duration);

      // Start interval that increments elapsed and updates percent
      let currentElapsed = initialElapsed;
      intervalRef.current = setInterval(() => {
        currentElapsed += 1;
        const percent = Math.min(90, Math.round((currentElapsed / duration) * 90));
        setAnimatedProgress(percent);
        if (currentElapsed > duration) setOverdue(true);
      }, 1000);

      return () => clearInterval(intervalRef.current);
    } else {
      // not in progress: reflect canonical progress values
      clearInterval(intervalRef.current);
      setOverdue(false);
      if (status === "In Queue") setAnimatedProgress(0);
      else if (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED") setAnimatedProgress(100);
      else if (typeof progress === "number") setAnimatedProgress(progress);
      else setAnimatedProgress(0);
    }
  }, [status, avgTime, elapsedTime, progress]);

  let displayProgress = animatedProgress;
  let showShimmer = false;
  let avgTimeText = null;

  if (status === "In Queue") {
    displayProgress = 0;
  } else if (status === "IN_PROGRESS") {
    showShimmer = true;
    displayProgress = typeof animatedProgress === "number" ? animatedProgress : 0;
    if (!avgTime || avgTime === 0) {
      if (overdue) {
        avgTimeText = `Job running for the first time... | Job still in progress and taking more time than usual...`;
      } else {
        avgTimeText = `Job running for the first time...`;
      }

    } else if (overdue) {
      avgTimeText = `Avg Time: ${Math.round(avgTime / 60)} min | Job still in progress and taking more time than usual...`;
    } else {
      avgTimeText = `Avg Time: ${Math.round(avgTime / 60)} min`;
    }
  } else if (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED") {
    displayProgress = 100;
  }

  const containerStyle = { display: "flex", flexDirection: "column", gap: 8 };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center" };
  const labelStyle = { fontSize: 12, color: "#9ca3af" };
  const valueStyle = { fontSize: 12, fontWeight: 600, color: "white" };
  const trackStyle = { width: "100%", backgroundColor: "#2a2a2a", borderRadius: 9999, height: 8, overflow: "hidden" };
  const barStyle = { height: "100%", borderRadius: 9999, transition: "width 0.5s ease-out", position: "relative", overflow: "hidden" };
  const shimmerStyle = {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
    animation: "shimmer 2s infinite",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={labelStyle}>Progress</span>
        <span style={valueStyle}>{displayProgress}%</span>
      </div>
      <div style={trackStyle}>
        <div style={{ ...barStyle, width: `${displayProgress}%`, backgroundColor: getColor() }}>
          {showShimmer && <div style={shimmerStyle} />}
        </div>
      </div>
      {avgTimeText && (
        <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2, fontWeight: 500 }}>
          {avgTimeText}
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
