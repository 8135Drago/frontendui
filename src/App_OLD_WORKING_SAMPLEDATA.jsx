import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import StatisticsChart from "./components/StatisticsChart";
import JobCard from "./components/JobCard";
import FilterBar from "./components/FilterBar";
import UserActionsLog from "./components/UserActionsLog";
import JobDetailsModal from "./components/JobDetailsModal";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  const [jobs, setJobs] = useState([]);
  const [userActions, setUserActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [jobNameFilter, setJobNameFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [selectedJob, setSelectedJob] = useState(null);

  // Mock data generator
  const generateMockData = () => {
    const statuses = ["queue", "running", "completed", "failed", "cancelled"];
    const jobNames = ["Data Processing", "Report Generation", "Backup Task", "ETL Pipeline", "Model Training"];
    const batchNames = ["Batch A", "Batch B", "Batch C", "Batch D"];
    const userNames = ["Alice Johnson", "Bob Smith", "Carol Williams", "David Brown"];

    const mockJobs = Array.from({ length: 100 }, (_, i) => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const progress =
        status === "completed"
          ? 100
          : status === "failed"
          ? Math.floor(Math.random() * 100)
          : status === "running"
          ? Math.floor(Math.random() * 80) + 10
          : 0;
      const startDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

      return {
        id: `job-${i + 1}`,
        jobName: jobNames[Math.floor(Math.random() * jobNames.length)],
        batchName: batchNames[Math.floor(Math.random() * batchNames.length)],
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        status,
        progress,
        startDate,
        endDate:
          status === "completed" || status === "failed" || status === "cancelled"
            ? new Date(new Date(startDate).getTime() + Math.random() * 2 * 60 * 60 * 1000).toISOString()
            : undefined,
      };
    });

    const actions = ["Started", "Completed", "Failed", "Cancelled", "Paused", "Resumed"];
    const mockActions = Array.from({ length: 50 }, (_, i) => ({
      id: `action-${i + 1}`,
      userName: userNames[Math.floor(Math.random() * userNames.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      jobName: jobNames[Math.floor(Math.random() * jobNames.length)],
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      details: "Action performed successfully",
    }));

    return { mockJobs, mockActions };
  };

  const fetchData = async (showToast = true) => {
    try {
      setRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const { mockJobs, mockActions } = generateMockData();
      setJobs(mockJobs);
      setUserActions(mockActions);
      if (showToast) toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => setCurrentPage(1), [jobNameFilter, userNameFilter, dateRangeFilter, statusFilter]);

  const isDateInRange = (dateString) => {
    if (!dateRangeFilter) return true;
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (dateRangeFilter) {
      case "today":
        return date >= today;
      case "yesterday":
        return date >= yesterday && date < today;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return date >= monthAgo;
      default:
        return true;
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesJobName = jobNameFilter === "" || job.jobName.toLowerCase().includes(jobNameFilter.toLowerCase());
      const matchesUserName = userNameFilter === "" || job.userName.toLowerCase().includes(userNameFilter.toLowerCase());
      const matchesDateRange = isDateInRange(job.startDate);
      const matchesStatus = statusFilter === "" || job.status === statusFilter;
      return matchesJobName && matchesUserName && matchesDateRange && matchesStatus;
    });
  }, [jobs, jobNameFilter, userNameFilter, dateRangeFilter, statusFilter]);

  const filteredActions = useMemo(() => {
    return userActions.filter((action) => {
      const matchesJobName = jobNameFilter === "" || action.jobName.toLowerCase().includes(jobNameFilter.toLowerCase());
      const matchesUserName = userNameFilter === "" || action.userName.toLowerCase().includes(userNameFilter.toLowerCase());
      const matchesDateRange = isDateInRange(action.timestamp);
      return matchesJobName && matchesUserName && matchesDateRange;
    });
  }, [userActions, jobNameFilter, userNameFilter, dateRangeFilter]);

  const statistics = useMemo(() => ({
    total: filteredJobs.length,
    queue: filteredJobs.filter((j) => j.status === "queue").length,
    running: filteredJobs.filter((j) => j.status === "running").length,
    completed: filteredJobs.filter((j) => j.status === "completed").length,
    failed: filteredJobs.filter((j) => j.status === "failed").length,
    cancelled: filteredJobs.filter((j) => j.status === "cancelled").length,
  }), [filteredJobs]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    setJobNameFilter("");
    setUserNameFilter("");
    setDateRangeFilter("today");
    setStatusFilter("");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
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
          <StatisticsChart statistics={statistics} />
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
                  <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
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
            </>
          )}
        </div>

        <div className="fade-in">
          <UserActionsLog actions={filteredActions} />
        </div>
      </main>

      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}

export default App;
