// App.jsx (fixed)
import React, { useState, useEffect, useMemo, useRef } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import StatisticsChart from "./components/StatisticsChart";
import JobCard from "./components/JobCard";
import FilterBar from "./components/FilterBar";
import UserActionsLog from "./components/UserActionsLog";
import JobDetailsModal from "./components/JobDetailsModal";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

const API_BASE = "http://localhost:8080/api";
const SESSION_KEY = "jobs_dashboard_filters_v2";

// ---------- helpers ----------
const dateRangeToDays = (range) => {
  switch (range) {
    case "today": return 1;
    case "yesterday": return 2;
    case "week": return 7;
    case "month": return 30;
    case "": return 0;
    default: return 30;
  }
};

function mapArrayToStatistics(rows) {
  const stats = { completed: 0, running: 0, queue: 0, failed: 0, cancelled: 0 };
  if (!Array.isArray(rows)) return { ...stats, total: 0 };
  rows.forEach((row) => {
    const statusRaw = row && row[1] ? String(row[1]) : "";
    const count = Number(row && row[2]) || 0;
    const s = statusRaw.trim().toLowerCase();
    if (s.includes("success") || s.includes("completed") || s.includes("succeeded")) stats.completed += count;
    else if (s.includes("in_progress") || s.includes("in progress") || s.includes("running") || s.includes("inprogress")) stats.running += count;
    else if (s.includes("queue") || s.includes("queued") || s.includes("in queue")) stats.queue += count;
    else if (s.includes("fail") || s.includes("failed") || s.includes("failure")) stats.failed += count;
    else if (s.includes("cancel") || s.includes("cancelled") || s.includes("canceled")) stats.cancelled += count;
  });
  const total = stats.completed + stats.running + stats.queue + stats.failed + stats.cancelled;
  return { ...stats, total };
}

// --- Status normalization helper ---
const normalizeStatus = (status) => {
  if (!status) return "";
  switch (status.trim().toUpperCase()) {
    case "FAILED": return "FAILED";
    case "SUCCESS": return "SUCCESS";
    case "IN_PROGRESS": return "IN_PROGRESS";
    case "IN QUEUE": return "In Queue";
    case "CANCELLED": return "CANCELLED";
    default: return status;
  }
};

function normalizeJobsArray(jobsData) {
  return (Array.isArray(jobsData) ? jobsData : []).map((j) => ({
    ...j,
    userName: j.userName || j.username || "",
    jobName: j.jobName || j.fileName || "",
    fileName: j.fileName || "",
    status: normalizeStatus(j.status || ""),
    startDate: j.startDate || j.startTime || j.uploadTime || null,
    endDate: j.endDate || j.endTime || null,
    batchName: j.batchName || j.batchId || null,
    environment: j.environment || j.env || null,
    executionTime: j.executionTime || null,
    id: j.id,
  }));
}

function normalizeActionsArray(actionsData) {
  return (Array.isArray(actionsData) ? actionsData : []).map((a) => ({
    ...a,
    id: a.id || a.actionId || null,
    userName: a.userName || a.username || a.user || "",
    action: a.action || a.type || "",
    jobName: a.jobName || a.fileName || a.target || "",
    fileName: a.fileName || "",
    timestamp: a.timestamp || a.createdAt || a.uploadTime || null,
    details: a.details || a.meta || a.payload || "",
  }));
}

// Client-side status matching (used for fallback filtering)
const matchesStatus = (jobStatusRaw, uiFilter) => {
  if (!uiFilter) return true;
  if (!jobStatusRaw) return false;
  return normalizeStatus(jobStatusRaw) === normalizeStatus(uiFilter);
};

// For in-progress jobs, calculate avgTime from previous runs (SUCCESS only)
const getAvgTimeForJob = (job, jobs) => {
  if (!job || !jobs) return null;
  const sameName = jobs.filter(j => j.jobName === job.jobName && j.status === "SUCCESS" && j.executionTime);
  if (!sameName.length) {
    return null;
  }
  // Log all occurrences for debugging
  const allOccurrences = jobs.filter(j => j.jobName === job.jobName);
  // eslint-disable-next-line no-console
  console.log(`No avg time for job '${job.jobName}'. All occurrences:`, allOccurrences);
  // executionTime in format "1h 2m 3s" or seconds
  const toSeconds = (et) => {
    if (typeof et === "number") return et;
    if (typeof et === "string") {
      const match = et.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
      if (!match) return 0;
      const [, h, m, s] = match.map(Number);
      return (h||0)*3600 + (m||0)*60 + (s||0);
    }
    return 0;
  };
  const avg = sameName.reduce((sum, j) => sum + toSeconds(j.executionTime), 0) / sameName.length;
  return avg;
};

// --- number formatter for human-friendly stats (1.3K, 1.45M, etc) ---
const formatNumber = (n) => {
  try {
    if (typeof n !== "number") return n;
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  } catch {
    return n;
  }
};

// ---------- App ----------
export default function App() {
  // restore persisted filters or defaults
  const persisted = (() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const [jobs, setJobs] = useState([]);
  const [userActions, setUserActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [jobNameFilter, setJobNameFilter] = useState(persisted.jobNameFilter ?? "");
  const [userNameFilter, setUserNameFilter] = useState(persisted.userNameFilter ?? "");
  // default to last 7 days by default for first-time users
  const [dateRangeFilter, setDateRangeFilter] = useState(persisted.dateRangeFilter ?? "week");
  const [statusFilter, setStatusFilter] = useState(persisted.statusFilter ?? "");

  const [currentPage, setCurrentPage] = useState(persisted.currentPage ?? 1);
  const ITEMS_PER_PAGE = 12;
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobAvgTime, setSelectedJobAvgTime] = useState(undefined);
  const [selectedJobElapsedTime, setSelectedJobElapsedTime] = useState(undefined);

  const [statistics, setStatistics] = useState({
    completed: 0,
    running: 0,
    queue: 0,
    failed: 0,
    cancelled: 0,
    total: 0,
  });

  // --- Shared elapsed time state for IN_PROGRESS jobs ---
  const [jobElapsedTimes, setJobElapsedTimes] = useState({});
  const timerRef = useRef(null);

  // Helper: get job start time as Date
  const getJobStartDate = (job) => {
    const d = job?.startDate || job?.startTime || job?.createdAt;
    return d ? new Date(d) : null;
  };

  // Update elapsed times for all IN_PROGRESS jobs
  useEffect(() => {
    // Find all IN_PROGRESS jobs
    const inProgress = jobs.filter(j => j.status === "IN_PROGRESS");
    const now = Date.now();
    const newElapsed = {};
    inProgress.forEach(job => {
      const start = getJobStartDate(job);
      if (start) {
        newElapsed[job.id] = Math.floor((now - start.getTime()) / 1000); // seconds
      }
    });
    setJobElapsedTimes(newElapsed);
  }, [jobs]);

  // Set up interval to update elapsed times every second
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setJobElapsedTimes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = updated[id] + 1;
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [jobs]);

  // persist filters
  useEffect(() => {
    const payload = { jobNameFilter, userNameFilter, dateRangeFilter, statusFilter, currentPage };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [jobNameFilter, userNameFilter, dateRangeFilter, statusFilter, currentPage]);

  const firstLoadRef = useRef(true);

  // fetchData (safe; doesn't mutate filters)
    // fetchData (safe; doesn't mutate filters)
  const fetchData = async (showToast = true, page = 0, size = 1000) => {
    try {
      setRefreshing(true);
      // Only fetch jobs/actions every 15s or on explicit refresh, not on filter change
      const jobsDays = dateRangeToDays(dateRangeFilter);

      // --- STAT DAYS LOGIC ---
      // On the very first load, request ALL-TIME stats (days=0).
      // On subsequent fetches, request stats for the selected range (or 0 for all-time).
      const statsDays = firstLoadRef.current ? 0 : (jobsDays === 0 ? 0 : jobsDays);

      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("size", String(size));
      params.append("days", String(jobsDays));
      // Only send filters if all three are set (for backend search)
      if (jobNameFilter && userNameFilter && statusFilter) {
        params.append("username", userNameFilter);
        params.append("jobName", jobNameFilter);
        params.append("fileName", jobNameFilter);
        params.append("status", statusFilter);
      }
      const [jobsRes, actionsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/jobs?${params.toString()}`),
        fetch(`${API_BASE}/actions?${params.toString()}`),
        fetch(`${API_BASE}/jobs/stats?days=${statsDays}`),
      ]);
      const jobsData = jobsRes.ok ? await jobsRes.json() : [];
      const actionsData = actionsRes.ok ? await actionsRes.json() : [];
      let statsDataRaw = null;
      if (statsRes && statsRes.ok) {
        try {
          statsDataRaw = await statsRes.json();
        } catch (e) {
          console.warn("Failed to parse stats response", e);
        }
      }
      const normalizedJobs = normalizeJobsArray(jobsData);
      let normalizedActions = normalizeActionsArray(actionsData);
      // fallback for empty actions when all-time was requested
      if ((!Array.isArray(normalizedActions) || normalizedActions.length === 0) && jobsDays === 0) {
        try {
          const fallback = await fetch(`${API_BASE}/actions?days=30&page=0&size=1000`);
          if (fallback.ok) {
            const fbJson = await fallback.json();
            if (Array.isArray(fbJson) && fbJson.length > 0) {
              normalizedActions = normalizeActionsArray(fbJson);
              // eslint-disable-next-line no-console
              console.info("Used fallback 30-day actions because all-time returned empty.");
            }
          }
        } catch {
          // ignore
        }
      }
      setJobs((prev) => (page === 0 ? normalizedJobs : [...prev, ...normalizedJobs]));
      setUserActions((prev) => (page === 0 ? normalizedActions : [...prev, ...normalizedActions]));
      const mappedStats = mapArrayToStatistics(statsDataRaw);
      setStatistics(mappedStats);
      if (showToast && !firstLoadRef.current) toast.success("Data refreshed successfully");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("fetchData error:", err);
      toast.error("Failed to load data from server");
    } finally {
      setLoading(false);
      setRefreshing(false);
      firstLoadRef.current = false;
    }
  };


  // Load more jobs (fetch next page of 1000)
  const [jobsPage, setJobsPage] = useState(0);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const handleLoadMoreJobs = async () => {
    const nextPage = jobsPage + 1;
    await fetchData(false, nextPage, 1000);
    setJobsPage(nextPage);
    // If less than 1000 jobs returned, no more jobs left
    setHasMoreJobs(jobs.length % 1000 === 0 && jobs.length !== 0);
  };

  // mount + periodic refresh (will not change dateRangeFilter)
  useEffect(() => {
    fetchData(false, 0, 1000);
    const interval = setInterval(() => fetchData(false, 0, 1000), 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove fetchData call from filter change effect
    // When any filter changes, reset page to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [jobNameFilter, userNameFilter, dateRangeFilter, statusFilter]);

  // When user changes the DATE RANGE, re-fetch so stats reflect the chosen range.
  // (We avoid refetching for every small filter change to reduce noise.)
  useEffect(() => {
    // If it's the very first mount, fetchData was already called in mount effect.
    // For subsequent user changes to date range, refresh data & stats.
    if (!firstLoadRef.current) {
      fetchData(false, 0, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeFilter]);


  // ---------- client-side date helper ----------
  const isDateInRange = (dateString) => {
    if (!dateRangeFilter) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateRangeFilter) {
      case "today": return date >= todayStart;
      case "yesterday": {
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        return date >= yesterdayStart && date < todayStart;
      }
      case "week": {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      }
      case "month": {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        return date >= monthAgo;
      }
      default: return true;
    }
  };

  // --- Filtering logic ---
  const shouldFetchFromBackend = jobNameFilter && userNameFilter && statusFilter;

  // Helper to add avgTime to jobs
  const jobsWithAvgTime = useMemo(() => {
    return jobs.map(job => ({
      ...job,
      avgTime: getAvgTimeForJob(job, jobs)
    }));
  }, [jobs]);

  // Update filteredJobs, inProgressJobsAll, inQueueJobsAll, paginatedJobs to use jobsWithAvgTime
  const filteredJobs = useMemo(() => {
    if (shouldFetchFromBackend) {
      return jobsWithAvgTime;
    }
    return jobsWithAvgTime.filter((job) => {
      const jobName = job?.jobName || job?.fileName || "";
      const userName = job?.userName || job?.username || "";
      const status = job?.status || "";
      const startDate = job?.startDate || job?.startTime || job?.createdAt || "";
      const matchesJobName = jobNameFilter === "" || jobName.toLowerCase().includes(jobNameFilter.toLowerCase());
      const matchesUserName = userNameFilter === "" || userName.toLowerCase().includes(userNameFilter.toLowerCase());
      const matchesStatusLocal = statusFilter === "" || matchesStatus(status, statusFilter);
      const matchesDateRange = isDateInRange(startDate);
      return matchesJobName && matchesUserName && matchesStatusLocal && matchesDateRange;
    });
  }, [jobsWithAvgTime, jobNameFilter, userNameFilter, statusFilter, dateRangeFilter, isDateInRange, shouldFetchFromBackend]);

  // --- Stats filtering ---
  const filteredStatistics = useMemo(() => {
    // If no filters, show last 7 days (default)
    if (!jobNameFilter && !userNameFilter && !statusFilter && dateRangeFilter === "week") return statistics;
    // Filter stats based on filteredJobs
    const stats = { completed: 0, running: 0, queue: 0, failed: 0, cancelled: 0, total: 0 };
    filteredJobs.forEach(job => {
      switch (job.status) {
        case "SUCCESS": stats.completed++; break;
        case "IN_PROGRESS": stats.running++; break;
        case "In Queue": stats.queue++; break;
        case "FAILED": stats.failed++; break;
        case "CANCELLED": stats.cancelled++; break;
        default: break;
      }
    });
    stats.total = stats.completed + stats.running + stats.queue + stats.failed + stats.cancelled;
    return stats;
  }, [filteredJobs, statistics, jobNameFilter, userNameFilter, statusFilter, dateRangeFilter]);

  // In-progress and In-queue jobs (paginated, max 5 per page)
  const [inProgressPage, setInProgressPage] = useState(1);
  const [inQueuePage, setInQueuePage] = useState(1);
  const INPROGRESS_PER_PAGE = 5;
  const inProgressJobsAll = useMemo(() => filteredJobs.filter((job) => job.status === "IN_PROGRESS"), [filteredJobs]);
  const inQueueJobsAll = useMemo(() => filteredJobs.filter((job) => job.status === "In Queue"), [filteredJobs]);
  const inProgressJobs = useMemo(() => inProgressJobsAll.slice((inProgressPage - 1) * INPROGRESS_PER_PAGE, inProgressPage * INPROGRESS_PER_PAGE), [inProgressJobsAll, inProgressPage]);
  const inQueueJobs = useMemo(() => inQueueJobsAll.slice((inQueuePage - 1) * INPROGRESS_PER_PAGE, inQueuePage * INPROGRESS_PER_PAGE), [inQueueJobsAll, inQueuePage]);
  const inProgressTotalPages = Math.max(1, Math.ceil(inProgressJobsAll.length / INPROGRESS_PER_PAGE));
  const inQueueTotalPages = Math.max(1, Math.ceil(inQueueJobsAll.length / INPROGRESS_PER_PAGE));

  const filteredActions = useMemo(() => {
    return userActions.filter((action) => {
      const fileName = action?.fileName || action?.jobName || "";
      const userName = action?.username || action?.userName || "";
      const timestamp = action?.timestamp || action?.createdAt || "";

      const matchesJobName = jobNameFilter === "" || fileName.toLowerCase().includes(jobNameFilter.toLowerCase());
      const matchesUserName = userNameFilter === "" || userName.toLowerCase().includes(userNameFilter.toLowerCase());
      const matchesDateRange = isDateInRange(timestamp);

      return matchesJobName && matchesUserName && matchesDateRange;
    });
  }, [userActions, jobNameFilter, userNameFilter, dateRangeFilter, isDateInRange]);

  // In all jobs section, show newest first, but exclude IN_PROGRESS and In Queue
  const allJobs = useMemo(() => filteredJobs.filter(job => job.status !== "IN_PROGRESS" && job.status !== "In Queue"), [filteredJobs]);
  const paginatedJobs = useMemo(() => {
    const sorted = [...allJobs].sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allJobs, currentPage]);
  const totalPages = Math.max(1, Math.ceil(allJobs.length / ITEMS_PER_PAGE));

  const handleResetFilters = () => {
    setJobNameFilter("");
    setUserNameFilter("");
    setDateRangeFilter("week"); // default "week"
    setStatusFilter("");
    setCurrentPage(1);
  };

  // --- ProgressBar sync: always pass avgTime and elapsedTime for ALL jobs, not just IN_PROGRESS ---
  const handleJobCardClick = (job) => {
    setSelectedJob(job);
    setSelectedJobAvgTime(job.avgTime);
    setSelectedJobElapsedTime(jobElapsedTimes[job.id] || 0);
  };

  // ---------- render ----------
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <header className="header">
        <div className="header-content">
          <div>
            <h1>Job Status Dashboard</h1>
            <p>Real-time job monitoring and analytics</p>
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing} className="refresh-button">
            <RefreshCw className={refreshing ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="fade-in">
          <StatisticsChart statistics={filteredStatistics} formatNumber={formatNumber} />
        </div>

        <div className="fade-in">
          <FilterBar
            jobNameFilter={jobNameFilter}
            userNameFilter={userNameFilter}
            dateRangeFilter={dateRangeFilter}
            statusFilter={statusFilter}
            onJobNameChange={setJobNameFilter}
            onUserNameChange={setUserNameFilter}
            onDateRangeChange={setDateRangeFilter}
            onStatusChange={setStatusFilter}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* In Progress Jobs Section */}
        {(inProgressJobsAll.length > 0 || inQueueJobsAll.length > 0) && (
          <div className="fade-in">
            {inProgressJobsAll.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div className="jobs-header">
                  <h2>In Progress Jobs ({inProgressJobsAll.length})</h2>
                  {inProgressTotalPages > 1 && (
                    <div className="pagination">
                      <button onClick={() => setInProgressPage(p => Math.max(1, p - 1))} disabled={inProgressPage === 1}><ChevronLeft /></button>
                      <span style={{ color: '#9ca3af', margin: '0 8px' }}>Page {inProgressPage} of {inProgressTotalPages}</span>
                      <button onClick={() => setInProgressPage(p => Math.min(inProgressTotalPages, p + 1))} disabled={inProgressPage === inProgressTotalPages}><ChevronRight /></button>
                    </div>
                  )}
                </div>
                <div className="job-grid" style={{ gap: 24 }}>
                  {inProgressJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      avgTime={job.avgTime}
                      elapsedTime={jobElapsedTimes[job.id] || 0}
                      onClick={() => handleJobCardClick(job)}
                    />
                  ))}
                </div>
              </div>
            )}
            {inQueueJobsAll.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div className="jobs-header">
                  <h2>In Queue Jobs ({inQueueJobsAll.length})</h2>
                  {inQueueTotalPages > 1 && (
                    <div className="pagination">
                      <button onClick={() => setInQueuePage(p => Math.max(1, p - 1))} disabled={inQueuePage === 1}><ChevronLeft /></button>
                      <span style={{ color: '#9ca3af', margin: '0 8px' }}>Page {inQueuePage} of {inQueueTotalPages}</span>
                      <button onClick={() => setInQueuePage(p => Math.min(inQueueTotalPages, p + 1))} disabled={inQueuePage === inQueueTotalPages}><ChevronRight /></button>
                    </div>
                  )}
                </div>
                <div className="job-grid" style={{ gap: 24 }}>
                  {inQueueJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      avgTime={job.avgTime}
                      elapsedTime={jobElapsedTimes[job.id] || 0}
                      onClick={() => handleJobCardClick(job)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* <div className="fade-in">
          <FilterBar
            jobNameFilter={jobNameFilter}
            userNameFilter={userNameFilter}
            dateRangeFilter={dateRangeFilter}
            statusFilter={statusFilter}
            onJobNameChange={setJobNameFilter}
            onUserNameChange={setUserNameFilter}
            onDateRangeChange={setDateRangeFilter}
            onStatusChange={setStatusFilter}
            onResetFilters={handleResetFilters}
          />
        </div> */}

        <div className="fade-in">
          {paginatedJobs.length === 0 ? (
            <div className="no-jobs">
              <p>No jobs found matching your filters</p>
              <button onClick={handleResetFilters} className="reset-btn">Reset Filters</button>
            </div>
          ) : (
            <>
              <div className="jobs-header">
                <h2>All Jobs ({filteredJobs.length})</h2>
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              <div className="job-grid">
                {paginatedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    avgTime={job.avgTime}
                    elapsedTime={jobElapsedTimes[job.id] || 0}
                    onClick={() => handleJobCardClick(job)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "active" : ""}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight />
                  </button>
                </div>
              )}
              {hasMoreJobs && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                  <button onClick={handleLoadMoreJobs} className="reset-btn">Load More Jobs</button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="fade-in">
          <UserActionsLog actions={filteredActions} />
        </div>
      </main>

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          avgTime={selectedJobAvgTime}
          elapsedTime={selectedJobElapsedTime}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
