import { useCallback, useEffect, useMemo, useState } from "react";
import { Config, storage } from "../../appwrite";
import axiosClient from "../../api";
import {
  Users,
  FileText,
  Download,
  Mail,
  Phone,
  Briefcase,
  Filter,
  Search,
  Calendar,
  Award,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  UserCheck,
  AlertCircle,
  ChevronDown,
  MoreVertical,
  ExternalLink,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicantsDashboard() {
  const [applications, setApplications] = useState([]);
  const [filteredRole, setFilteredRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingCV, setDownloadingCV] = useState(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/api/apply/get-applications");
        // Handle nested data structure
        const applicationsData = response.data?.data || response.data || [];
        setApplications(applicationsData);
        setError(null);
        toast.success(`${applicationsData.length} applications loaded`);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError(error.message || "Failed to load applications");
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    const roles = applications.map((app) => app.role).filter(Boolean);
    return [...new Set(roles)];
  }, [applications]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const today = new Date();
    const thisWeek = applications.filter((app) => {
      const appDate = new Date(app.$createdAt || app.createdAt);
      const diffTime = Math.abs(today - appDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;

    const roleDistribution = applications.reduce((acc, app) => {
      const role = app.role || "Unknown";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      thisWeek,
      roleDistribution,
      topRole: Object.entries(roleDistribution).sort(
        (a, b) => b[1] - a[1]
      )[0] || ["None", 0],
    };
  }, [applications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    let filtered = applications.filter((app) => {
      const matchesRole = filteredRole === "All" || app.role === filteredRole;
      const matchesSearch =
        searchTerm === "" ||
        app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.role?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesRole && matchesSearch;
    });

    // Sort applications
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "createdAt") {
        aValue = new Date(a.$createdAt || a.createdAt || 0);
        bValue = new Date(b.$createdAt || b.createdAt || 0);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [applications, filteredRole, searchTerm, sortConfig]);

  // Pagination
  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Download CV
  const downloadCV = async (cvId, applicantName) => {
    if (!cvId) {
      toast.warning("No CV uploaded for this applicant.");
      return;
    }

    setDownloadingCV(cvId);
    try {
      const result = storage.getFileDownload(
        Config.APPLICANT_CVS_BUCKET_ID,
        cvId
      );

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = result.href;
      link.download = `${applicantName.replace(/\s+/g, "_")}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CV downloaded successfully", {
        description: `${applicantName}'s CV is being downloaded`,
        icon: <Download className="w-4 h-4 text-green-500" />,
      });
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error("Failed to download CV", {
        description: "Please try again or contact support",
      });
    } finally {
      setDownloadingCV(null);
    }
  };

  // Status badge component
  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      pending: {
        bg: "bg-gradient-to-r from-[#F39C12] to-[#D68910]",
        icon: <Clock className="w-3 h-3" />,
        label: "Pending Review",
      },
      reviewed: {
        bg: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
        icon: <Eye className="w-3 h-3" />,
        label: "Under Review",
      },
      shortlisted: {
        bg: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
        icon: <Star className="w-3 h-3" />,
        label: "Shortlisted",
      },
      rejected: {
        bg: "bg-gradient-to-r from-[#E74C3C] to-[#C0392B]",
        icon: <XCircle className="w-3 h-3" />,
        label: "Rejected",
      },
      hired: {
        bg: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Hired",
      },
    };

    const config = statusConfig[status?.toLowerCase()] || {
      bg: "bg-gradient-to-r from-[#95A5A6] to-[#7F8C8D]",
      icon: <AlertCircle className="w-3 h-3" />,
      label: status || "Pending",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} text-white shadow-sm`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }, []);

  // Role badge component
  const getRoleBadge = useCallback((role) => {
    const roleColors = {
      "Marketing Associate": "from-[#3498DB] to-[#2980B9]",
      "Vendor Relations Coordinator": "from-[#9B59B6] to-[#8E44AD]",
      "Customer Care Representative": "from-[#27AE60] to-[#2ECC71]",
      "Sales Executive": "from-[#E67E22] to-[#D35400]",
      "Operations Manager": "from-[#D4A017] to-[#B8860B]",
    };

    const color = roleColors[role] || "from-[#7F8C8D] to-[#616A6B]";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${color} text-white shadow-sm`}
      >
        <Briefcase className="w-3 h-3" />
        {role}
      </span>
    );
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"
                ></div>
              ))}
            </div>
            <div className="h-16 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            Failed to Load Applications
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
            {error || "An error occurred while loading applications"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200"
          >
            <Users className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Talent Acquisition Hub
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Review, manage, and hire exceptional talent for your team
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Download className="w-4 h-4" />
                Export Applications
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <UserCheck className="w-4 h-4" />
                Add Job Opening
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Applications
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />+{stats.thisWeek} this week
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Top Role
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3] truncate">
                  {stats.topRole[0]}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017] flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {stats.topRole[1]} applicants
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  CVs Uploaded
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {applications.filter((app) => app.cvId).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {Math.round(
                (applications.filter((app) => app.cvId).length /
                  applications.length) *
                  100
              )}
              % rate
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Avg. Experience
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  2.4 years
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              High quality pool
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search applicants by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filteredRole}
                onChange={(e) => setFilteredRole(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent min-w-[200px]"
              >
                <option value="All">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilteredRole("All");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/80 dark:hover:bg-[#2A2A2A]/80 transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl mb-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                  {[
                    { key: "name", label: "Applicant" },
                    { key: "role", label: "Role" },
                    { key: "email", label: "Contact" },
                    { key: "createdAt", label: "Applied" },
                    { key: "status", label: "Status" },
                    { label: "CV" },
                    { label: "Actions" },
                  ].map(({ key, label }) => (
                    <th key={label} className="px-6 py-4 text-left">
                      <button
                        onClick={() => key && handleSort(key)}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017] hover:text-[#B8860B] dark:hover:text-[#FFD700] transition-colors"
                      >
                        {label}
                        {key && sortConfig.key === key && (
                          <span className="text-[#D4A017]">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
                {paginatedApplications.length > 0 ? (
                  paginatedApplications.map((app) => (
                    <tr
                      key={app.$id}
                      className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group"
                    >
                      {/* Applicant Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {app.name?.charAt(0).toUpperCase() || "A"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              {app.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {app.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">{getRoleBadge(app.role)}</td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <a
                              href={`mailto:${app.email}`}
                              className="text-sm text-[#2C1810] dark:text-[#F5E6D3] hover:text-[#D4A017] dark:hover:text-[#FFD700] transition-colors truncate"
                            >
                              {app.email}
                            </a>
                          </div>
                          {app.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {app.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(
                            app.$createdAt || app.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(app.status)}
                      </td>

                      {/* CV */}
                      <td className="px-6 py-4">
                        {app.cvId ? (
                          <button
                            onClick={() => downloadCV(app.cvId, app.name)}
                            disabled={downloadingCV === app.cvId}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white text-sm font-semibold hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            {downloadingCV === app.cvId ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Download CV
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            No CV
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-[#3498DB]" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                            title="Shortlist"
                          >
                            <Star className="w-4 h-4 text-[#D4A017]" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <Users className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
                      <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                        No applications found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm || filteredRole !== "All"
                          ? "Try adjusting your filters"
                          : "No applications have been submitted yet"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Showing{" "}
                  <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredApplications.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                    {filteredApplications.length}
                  </span>{" "}
                  applications
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            currentPage === pageNumber
                              ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white"
                              : "text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                          } transition-colors text-sm`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-9 h-9 rounded-lg text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors text-sm"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  Application Details
                </h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                >
                  <XCircle className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Applicant Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50 rounded-xl p-6">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">
                          {selectedApplication.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                        {selectedApplication.name}
                      </h4>
                      <div className="mt-2">
                        {getRoleBadge(selectedApplication.role)}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
                          Contact Information
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a
                              href={`mailto:${selectedApplication.email}`}
                              className="text-sm text-[#2C1810] dark:text-[#F5E6D3] hover:text-[#D4A017] dark:hover:text-[#FFD700]"
                            >
                              {selectedApplication.email}
                            </a>
                          </div>
                          {selectedApplication.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                                {selectedApplication.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
                          Application Status
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedApplication.status)}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-1">
                          Applied On
                        </p>
                        <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                          {new Date(
                            selectedApplication.$createdAt ||
                              selectedApplication.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Motivation & Actions */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-3">
                      Motivation Letter
                    </h4>
                    <div className="bg-white/50 dark:bg-[#2A2A2A]/50 p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A]">
                      <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3] whitespace-pre-wrap">
                        {selectedApplication.motivation}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        downloadCV(
                          selectedApplication.cvId,
                          selectedApplication.name
                        )
                      }
                      disabled={
                        !selectedApplication.cvId ||
                        downloadingCV === selectedApplication.cvId
                      }
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white font-semibold hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download CV
                    </button>
                    <button className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send Email
                    </button>
                  </div>

                  {/* Status Update */}
                  <div>
                    <h4 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-3">
                      Update Status
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        "pending",
                        "reviewed",
                        "shortlisted",
                        "rejected",
                        "hired",
                      ].map((status) => (
                        <button
                          key={status}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedApplication.status === status
                              ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white"
                              : "bg-white/50 dark:bg-[#2A2A2A]/50 text-[#2C1810] dark:text-[#F5E6D3] hover:bg-white dark:hover:bg-[#2A2A2A]"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-8 p-6 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Need help with hiring decisions?
              </p>
              <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                Contact HR support or schedule candidate interviews
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200">
              <Shield className="w-4 h-4" />
              Schedule Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

