import React from "react";
import {
  Search,
  Filter,
  X,
  Calendar,
  ArrowDownNarrowWideIcon,
} from "lucide-react";

const FilterBar = ({
  jobNameFilter,
  userNameFilter,
  dateRangeFilter,
  statusFilter,
  onJobNameChange,
  onUserNameChange,
  onDateRangeChange,
  onStatusChange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    jobNameFilter || userNameFilter || dateRangeFilter || statusFilter;

  const styles = {
    container: {
      backgroundColor: "#1a1a1a",
      border: "1px solid #2a2a2a",
      borderRadius: 8,
      padding: 16,
      marginBottom: "3%",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      flexWrap: "wrap",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 8 },
    title: { fontSize: 18, fontWeight: 600, color: "white" },
    icon: { width: 20, height: 20, color: "#9ca3af" },
    activeBadge: {
      padding: "2px 6px",
      background: "rgba(59,130,246,0.2)",
      color: "#3b82f6",
      fontSize: 12,
      borderRadius: 12,
      border: "1px solid rgba(59,130,246,0.5)",
    },
    resetButton: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 12px",
      fontSize: 14,
      color: "#9ca3af",
      background: "#0a0a0a",
      border: "1px solid #2a2a2a",
      borderRadius: 8,
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginTop: 8,
    },
    grid: {
      display: "flex",
      flexWrap: "wrap",
      gap: 16,
      width: "100%",
      justifyContent: "space-between",
    },
    inputContainer: {
      position: "relative",
      flex: "1 1 220px",
      minWidth: 220,
    },
    inputIcon: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      width: 16,
      height: 16,
      color: "#9ca3af",
      pointerEvents: "none",
    },
    inputBase: {
      width: "100%",
      padding: "8px 12px 8px 34px", // aligned for all inputs & selects
      backgroundColor: "#0a0a0a",
      border: "1px solid #2a2a2a",
      borderRadius: 8,
      color: "white",
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.3s ease",
      boxSizing: "border-box",
      height: 38, // Ensures consistent height
    },
    inputFocus: { borderColor: "#3b82f6" },
  };

  const handleFocus = (e) =>
    Object.assign(e.target.style, styles.inputFocus);
  const handleBlur = (e) => Object.assign(e.target.style, styles.inputBase);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Filter style={styles.icon} />
          <h3 style={styles.title}>Filters</h3>
          {hasActiveFilters && <span style={styles.activeBadge}>Active</span>}
        </div>

        {hasActiveFilters && (
          <button
            style={styles.resetButton}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, {
                color: "white",
                background: "rgba(239,68,68,0.2)",
                borderColor: "rgba(239,68,68,0.5)",
              })
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, styles.resetButton)
            }
            onClick={onResetFilters}
          >
            <X style={{ width: 16, height: 16 }} />
            Reset
          </button>
        )}
      </div>

      <div style={styles.grid}>
        {/* Job Name */}
        <div style={styles.inputContainer}>
          <Search style={styles.inputIcon} />
          <input
            type="text"
            placeholder="Search job name..."
            value={jobNameFilter}
            onChange={(e) => onJobNameChange(e.target.value)}
            style={styles.inputBase}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        {/* Username */}
        <div style={styles.inputContainer}>
          <Search style={styles.inputIcon} />
          <input
            type="text"
            placeholder="Search username..."
            value={userNameFilter}
            onChange={(e) => onUserNameChange(e.target.value)}
            style={styles.inputBase}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        {/* Date Range */}
        <div style={styles.inputContainer}>
          <Calendar style={styles.inputIcon} />
          <select
            value={dateRangeFilter}
            onChange={(e) => onDateRangeChange(e.target.value)}
            style={styles.inputBase}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {/* Status */}
        <div style={styles.inputContainer}>
          <ArrowDownNarrowWideIcon style={styles.inputIcon} />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            style={styles.inputBase}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="">All Statuses</option>
            <option value="queue">Queue</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
