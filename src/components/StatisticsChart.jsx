import React, { useEffect, useMemo, useState } from "react";

// Format large numbers (fallback if parent doesn't provide formatter)
const formatLargeNumber = (num) => {
  if (typeof num !== "number" || Number.isNaN(num)) return num;
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(num);
};

const StatisticsChart = ({ statistics = {}, formatNumber }) => {
  const format = (n) => (typeof formatNumber === "function" ? formatNumber(n) : formatLargeNumber(n));

  const completed = Number(statistics.completed) || 0;
  const running = Number(statistics.running) || 0;
  const queue = Number(statistics.queue) || 0;
  const failed = Number(statistics.failed) || 0;
  const cancelled = Number(statistics.cancelled) || 0;

  const derivedTotal = Number(statistics.total);
  const sumParts = completed + running + queue + failed + cancelled;
  const total = Number.isFinite(derivedTotal) && derivedTotal > 0 ? derivedTotal : sumParts;

  const statusData = useMemo(
    () => [
      { label: "Completed", value: completed, color: "#10b981" },
      { label: "Running", value: running, color: "#3b82f6" },
      { label: "Queue", value: queue, color: "#f59e0b" },
      { label: "Failed", value: failed, color: "#ef4444" },
      { label: "Cancelled", value: cancelled, color: "#6b7280" },
    ],
    [completed, running, queue, failed, cancelled]
  );

  const statusWithPerc = useMemo(
    () =>
      statusData.map((it) => ({
        ...it,
        percentage: total > 0 ? (it.value / total) * 100 : 0,
      })),
    [statusData, total]
  );

  const [isLarge, setIsLarge] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > 1024 : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1025px)");
    const handler = (e) => setIsLarge(e.matches);
    setIsLarge(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  const [hovered, setHovered] = useState(null);

  const baseContainerStyle = {
    background: "#1a1a1a",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #2a2a2a",
    transition: "all 0.2s ease",
    marginBottom: "3%",
  };

  const titleStyle = { fontSize: 20, fontWeight: 700, color: "white", margin: 0 };
  const subText = { fontSize: 14, color: "#9ca3af" };

  const barOuter = {
    background: "#2a2a2a",
    borderRadius: 9999,
    height: 12,
    overflow: "hidden",
  };

  const legendGrid = {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
    width: "100%",
  };

  // Build slices: support normal arcs, full-circle slice, and handle zero-total
  const slices = useMemo(() => {
    // if total is 0 -> no regular slices; render ring instead in render block
    if (total === 0) return [];

    let currentAngle = 0;
    return statusWithPerc
      .map((item) => {
        const angle = (item.percentage / 100) * 360;
        if (angle <= 0) return null; // skip zero slices

        // if this slice consumes (almost) the entire circle, we can't draw an arc path
        // because start === end -> degenerate path. Mark as full slice.
        if (Math.abs(angle - 360) < 1e-6 || item.percentage >= 99.999) {
          currentAngle += angle;
          return { full: true, color: item.color, label: item.label, value: item.value, percentage: item.percentage };
        }

        const startAngle = currentAngle;
        currentAngle += angle;
        const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
        const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
        const endX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
        const endY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
        const largeArc = angle > 180 ? 1 : 0;
        // pie-slice path (filled)
        const d = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
        return { d, color: item.color, label: item.label, value: item.value, percentage: item.percentage };
      })
      .filter(Boolean);
  }, [statusWithPerc, total]);

  const displayTotalValue = total;
  const displayTotal = format(displayTotalValue);

  return (
    <div
      style={{ ...baseContainerStyle, width: "100%", maxWidth: "100%" }}
      onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid #3a3a3a")}
      onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid #2a2a2a")}
      role="region"
      aria-label="Job statistics overview"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={titleStyle}>Job Statistics Overview</h2>
        <div style={subText}>
          Showing{" "}
          <span style={{ color: "white", fontWeight: 600 }}>{displayTotal}</span>{" "}
          jobs
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: isLarge ? "row" : "column", gap: 24, width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {statusWithPerc.map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "#9ca3af" }}>{item.label}</span>
                <span style={{ fontSize: 14, color: "white", fontWeight: 600 }}>{format(item.value)}</span>
              </div>
              <div style={barOuter} aria-hidden>
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, item.percentage))}%`,
                    backgroundColor: item.color,
                    height: "100%",
                    borderRadius: "inherit",
                    transition: "width 800ms cubic-bezier(.2,.8,.2,1)",
                  }}
                />
                {hovered === item.label && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: -32,
                      background: "#222",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      pointerEvents: "none",
                      zIndex: 10,
                    }}
                  >
                    {`${item.label} Jobs: ${format(item.value)}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 320 }}>
          <div style={{ position: "relative", width: 250, height: 250, margin: "0 auto" }}>
            <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }} role="img" aria-label="Job distribution donut">
              {/* If total === 0 -> show subtle ring */}
              {total === 0 && (
                <g>
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="12"
                    onMouseEnter={() => setHovered("TotalZero")}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "default" }}
                  />
                </g>
              )}

              {/* Render full-circle slices (if any) as a circle so we don't produce degenerate path */}
              {slices.map((s, i) => {
                if (s.full) {
                  // draw full filled disk for that category; inner circle will create donut hole
                  return <circle key={`full-${i}`} cx="50" cy="50" r="40" fill={s.color} onMouseEnter={() => setHovered(s.label)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }} />;
                }
                return (
                  <path
                    key={i}
                    d={s.d}
                    fill={s.color}
                    style={{ transition: "opacity 120ms ease", cursor: "pointer" }}
                    onMouseEnter={() => setHovered(s.label)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}

              {/* inner circle to form donut hole */}
              <circle cx="50" cy="50" r="25" fill="#0a0a0a" />
            </svg>

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>{displayTotal}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Total Jobs</span>
            </div>

            {/* Tooltip for donut + total ring */}
            {hovered && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  transform: "translateX(-50%)",
                  background: "#222",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 13,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                {hovered === "TotalZero" && `0 Jobs`}
                {hovered === "Completed" && `Success Jobs: ${format(completed)}`}
                {hovered === "Running" && `In Progress Jobs: ${format(running)}`}
                {hovered === "Queue" && `In Queue Jobs: ${format(queue)}`}
                {hovered === "Failed" && `Failed Jobs: ${format(failed)}`}
                {hovered === "Cancelled" && `Cancelled Jobs: ${format(cancelled)}`}
                {/* fallback if hovered corresponds to a label that is present but value maybe zero */}
                {!["TotalZero","Completed","Running","Queue","Failed","Cancelled"].includes(hovered) && hovered && (
                  <span>{hovered}</span>
                )}
              </div>
            )}
          </div>

          <div style={{ ...legendGrid, flexWrap: "nowrap", justifyContent: "center", width: "100%", overflowX: "auto" }}>
            {statusWithPerc.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {item.label} — <strong style={{ color: "white" }}>{format(item.value)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsChart;
