/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo, useCallback } from "react";
import { getStaff, deleteStaff, updateStaff } from "../services/staffService";
import StaffForm from "../components/Staffform";
import AddCareerForm from "../components/AddCareerForm";
import {
  Search,
  Users,
  UserPlus,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Shield,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Download,
  Filter,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  Building,
  GraduationCap,
  Star,
} from "lucide-react";
import { toast } from "sonner";

export default function Staff() {
  // State Management
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isStaffFormVisible, setIsStaffFormVisible] = useState(false);
  const [isCareerFormVisible, setIsCareerFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [expandedStaff, setExpandedStaff] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [sortOption, setSortOption] = useState("newest");
  const itemsPerPage = 12;

  // Fetch staff data
  useEffect(() => {
    const fetchStaffData = async () => {
      setLoading(true);
      try {
        const data = await getStaff();
        if (Array.isArray(data)) {
          setStaffList(data);
          setError(null);
          toast.success(`${data.length} staff members loaded`);
        } else {
          setStaffList([]);
          toast.warning("No staff data available");
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
        setError(err.message || "Failed to load staff data");
        toast.error("Failed to load staff data");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  // Calculate statistics
  const staffStats = useMemo(() => {
    const totalStaff = staffList.length;
    const activeStaff = staffList.filter((s) => s.status !== "inactive").length;
    const departmentCounts = staffList.reduce((acc, staff) => {
      const dept = staff.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const roleCounts = staffList.reduce((acc, staff) => {
      const role = staff.role || "Unknown";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const topDepartment = Object.entries(departmentCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      totalStaff,
      activeStaff,
      inactiveStaff: totalStaff - activeStaff,
      departments: Object.keys(departmentCounts).length,
      topDepartment: topDepartment
        ? `${topDepartment[0]} (${topDepartment[1]})`
        : "N/A",
      avgStaffTenure: "1.8 years", // This would require hire date data
    };
  }, [staffList]);

  // Get unique departments and roles
  const uniqueDepartments = useMemo(
    () => [...new Set(staffList.map((s) => s.department).filter(Boolean))],
    [staffList]
  );

  const uniqueRoles = useMemo(
    () => [...new Set(staffList.map((s) => s.role).filter(Boolean))],
    [staffList]
  );

  // Filter and sort staff
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = staffList.filter((staff) => {
      const matchesSearch =
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        selectedDepartment === "all" || staff.department === selectedDepartment;
      const matchesRole = selectedRole === "all" || staff.role === selectedRole;
      const matchesStatus =
        selectedStatus === "all" || staff.status === selectedStatus;

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });

    // Sort staff
    switch (sortOption) {
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.$createdAt || 0) - new Date(a.$createdAt || 0)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.$createdAt || 0) - new Date(b.$createdAt || 0)
        );
        break;
      case "nameAsc":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "nameDesc":
        filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      default:
        break;
    }

    return filtered;
  }, [
    staffList,
    searchTerm,
    selectedDepartment,
    selectedRole,
    selectedStatus,
    sortOption,
  ]);

  // Pagination
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedStaff, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedStaff.length / itemsPerPage);

  // Event Handlers
  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${name || "this staff member"}?`
      )
    ) {
      return;
    }

    try {
      await deleteStaff(id);
      setStaffList((prev) => prev.filter((staff) => staff.$id !== id));
      toast.success("Staff member deleted successfully");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff member");
    }
  };

  const handleEdit = async (id) => {
    const name = prompt("Enter new name:");
    if (!name) return;

    try {
      const updated = await updateStaff(id, { name });
      setStaffList((prev) =>
        prev.map((staff) => (staff.$id === id ? { ...staff, name } : staff))
      );
      toast.success("Staff member updated successfully");
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Failed to update staff member");
    }
  };

  const handleToggleStaffForm = () => {
    setIsStaffFormVisible((prev) => !prev);
    setIsCareerFormVisible(false);
  };

  const handleToggleCareerForm = () => {
    setIsCareerFormVisible((prev) => !prev);
    setIsStaffFormVisible(false);
  };

  const toggleStaffDetails = useCallback((staffId) => {
    setExpandedStaff((current) => (current === staffId ? null : staffId));
  }, []);

  // Role badge component
  const getRoleBadge = useCallback((role) => {
    const roleConfig = {
      admin: {
        bg: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
        text: "text-white",
        icon: <Shield className="w-3 h-3" />,
      },
      manager: {
        bg: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
        text: "text-white",
        icon: <Building className="w-3 h-3" />,
      },
      staff: {
        bg: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
        text: "text-white",
        icon: <Users className="w-3 h-3" />,
      },
      support: {
        bg: "bg-gradient-to-r from-[#F39C12] to-[#D68910]",
        text: "text-white",
        icon: <Award className="w-3 h-3" />,
      },
      intern: {
        bg: "bg-gradient-to-r from-[#95A5A6] to-[#7F8C8D]",
        text: "text-white",
        icon: <GraduationCap className="w-3 h-3" />,
      },
    };

    const config = roleConfig[role?.toLowerCase()] || {
      bg: "bg-gradient-to-r from-[#7F8C8D] to-[#616A6B]",
      text: "text-white",
      icon: <Users className="w-3 h-3" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`}
      >
        {config.icon}
        {role || "Staff"}
      </span>
    );
  }, []);

  // Department badge component
  const getDepartmentBadge = useCallback((department) => {
    const deptColors = {
      operations: "bg-gradient-to-r from-[#D4A017] to-[#B8860B]",
      sales: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
      marketing: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
      support: "bg-gradient-to-r from-[#F39C12] to-[#D68910]",
      it: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
      hr: "bg-gradient-to-r from-[#E74C3C] to-[#C0392B]",
    };

    const color =
      deptColors[department?.toLowerCase()] ||
      "bg-gradient-to-r from-[#95A5A6] to-[#7F8C8D]";

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${color} text-white`}
      >
        {department || "Unassigned"}
      </span>
    );
  }, []);

  // Loading State
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            Failed to Load Staff Data
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
            {error || "An error occurred while loading staff data"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
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
                Team Management
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Manage your staff, roles, departments, and career opportunities
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Download className="w-4 h-4" />
                Export Staff
              </button>
              <button
                onClick={handleToggleStaffForm}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${
                  isStaffFormVisible
                    ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                    : "bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {isStaffFormVisible ? "Cancel" : "Add Staff"}
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
                  Total Staff
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {staffStats.totalStaff}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />+
              {Math.floor(staffStats.totalStaff * 0.08)} this quarter
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Active Staff
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {staffStats.activeStaff}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60]">
              {(
                (staffStats.activeStaff / staffStats.totalStaff) * 100 || 0
              ).toFixed(1)}
              % active
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Departments
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {staffStats.departments}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017] truncate">
              Top: {staffStats.topDepartment}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Avg Tenure
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {staffStats.avgStaffTenure}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#F39C12] to-[#D68910] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <Star className="w-3 h-3" />
              High retention
            </div>
          </div>
        </div>

        {/* Promotion Section */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                Career Opportunities
              </h3>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Post new job openings and manage applications
              </p>
            </div>

            <button
              onClick={handleToggleCareerForm}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 ${
                isCareerFormVisible
                  ? "bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white"
                  : "bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              {isCareerFormVisible ? "Cancel" : "Add Career"}
            </button>
          </div>

          {/* Forms */}
          {isStaffFormVisible && (
            <div className="mb-6">
              <StaffForm
                onSuccess={() => {
                  setIsStaffFormVisible(false);
                  window.location.reload();
                }}
              />
            </div>
          )}
          {isCareerFormVisible && (
            <div className="mb-6">
              <AddCareerForm
                onSuccess={() => {
                  setIsCareerFormVisible(false);
                  toast.success("Career opportunity added successfully");
                }}
              />
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search staff by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white border-transparent"
                    : "border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                }`}
                title="Grid View"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white border-transparent"
                    : "border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                }`}
                title="List View"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((role, idx) => (
                <option key={idx} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="nameAsc">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Staff Display */}
        {viewMode === "grid" ? (
          // Grid View
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedStaff.map((staff) => (
                <div
                  key={staff.$id}
                  className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Staff Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {staff.name?.charAt(0) || "S"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                            {staff.name}
                          </h3>
                          <div className="mt-1">{getRoleBadge(staff.role)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStaffDetails(staff.$id)}
                        className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-[#8B4513] dark:text-[#D4A017] transition-transform ${
                            expandedStaff === staff.$id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Department */}
                    <div className="mb-3">
                      {getDepartmentBadge(staff.department)}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300 truncate">
                          {staff.email}
                        </span>
                      </div>
                      {staff.phonenumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">
                            {staff.phonenumber}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {expandedStaff === staff.$id && (
                      <div className="mt-4 pt-4 border-t border-[#E8D6B5] dark:border-[#3A3A3A] space-y-3">
                        {staff.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {staff.address}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            Status:
                          </span>
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                staff.status === "active"
                                  ? "bg-[#27AE60] animate-pulse"
                                  : "bg-[#E74C3C]"
                              }`}
                            ></div>
                            <span
                              className={`font-medium ${
                                staff.status === "active"
                                  ? "text-[#27AE60]"
                                  : "text-[#E74C3C]"
                              }`}
                            >
                              {staff.status || "active"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => handleEdit(staff.$id)}
                        className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                        title="Edit Staff"
                      >
                        <Edit className="w-4 h-4 text-[#D4A017]" />
                      </button>
                      <button
                        onClick={() => handleDelete(staff.$id, staff.name)}
                        className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                        title="Delete Staff"
                      >
                        <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // List View
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl mb-8">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Staff Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#8B4513] dark:text-[#D4A017]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
                  {paginatedStaff.map((staff) => (
                    <tr
                      key={staff.$id}
                      className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                            <span className="text-white font-bold">
                              {staff.name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              {staff.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {staff.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(staff.role)}</td>
                      <td className="px-6 py-4">
                        {getDepartmentBadge(staff.department)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                            <Mail className="w-3 h-3 inline mr-2 text-gray-400" />
                            {staff.email}
                          </div>
                          {staff.phonenumber && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="w-3 h-3 inline mr-2 text-gray-400" />
                              {staff.phonenumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              staff.status === "active"
                                ? "bg-[#27AE60] animate-pulse"
                                : "bg-[#E74C3C]"
                            }`}
                          ></div>
                          <span
                            className={`text-sm font-semibold ${
                              staff.status === "active"
                                ? "text-[#27AE60]"
                                : "text-[#E74C3C]"
                            }`}
                          >
                            {staff.status || "active"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(staff.$id)}
                            className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-[#D4A017]" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.$id, staff.name)}
                            className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
              Showing{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedStaff.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                {filteredAndSortedStaff.length}
              </span>{" "}
              staff members
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
        )}

        {/* Empty State */}
        {filteredAndSortedStaff.length === 0 && !loading && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
              No Staff Members Found
            </h3>
            <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
              {searchTerm ||
              selectedDepartment !== "all" ||
              selectedRole !== "all" ||
              selectedStatus !== "all"
                ? "Try adjusting your filters or search terms"
                : "No staff members have been added yet"}
            </p>
            <button
              onClick={handleToggleStaffForm}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200"
            >
              <UserPlus className="w-4 h-4" />
              Add Your First Staff Member
            </button>
          </div>
        )}

        {/* HR Resources Section */}
        <div className="mt-8 space-y-6">
          {/* Section Header */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
              HR Resources & Tools
            </h3>
            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
              Essential resources for effective team management and employee
              support
            </p>
          </div>

          {/* HR Resource Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Employee Handbook */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  Employee Handbook
                </h4>
                <span className="text-xs bg-[#3498DB]/20 text-[#3498DB] px-2 py-1 rounded-full">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                127 policies • Last updated Dec 15, 2024
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                Code of conduct, benefits, remote work guidelines
              </p>
              <div className="text-xs text-[#3498DB] font-medium">
                View Handbook →
              </div>
            </div>

            {/* Performance Reviews */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  Performance Reviews
                </h4>
                <span className="text-xs bg-[#F39C12]/20 text-[#F39C12] px-2 py-1 rounded-full">
                  Q4 Due
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                23 pending • 67 completed this quarter
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                360° feedback, goals tracking, development plans
              </p>
              <div className="text-xs text-[#27AE60] font-medium">
                Manage Reviews →
              </div>
            </div>

            {/* Training Resources */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#F39C12] to-[#D68910] flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  Training Programs
                </h4>
                <span className="text-xs bg-[#27AE60]/20 text-[#27AE60] px-2 py-1 rounded-full">
                  New
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                42 courses • 15 certifications available
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                Leadership, Tech Skills, Compliance Training
              </p>
              <div className="text-xs text-[#F39C12] font-medium">
                Browse Library →
              </div>
            </div>

            {/* Benefits Center */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  Benefits Center
                </h4>
                <span className="text-xs bg-[#E74C3C]/20 text-[#E74C3C] px-2 py-1 rounded-full">
                  Enrollment
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                96% enrolled • Open until Jan 31, 2025
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                Health, Dental, Vision, 401k, Wellness Program
              </p>
              <div className="text-xs text-[#9B59B6] font-medium">
                Manage Benefits →
              </div>
            </div>

            {/* Time Off Tracker */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  Time Off Tracker
                </h4>
                <span className="text-xs bg-[#F39C12]/20 text-[#F39C12] px-2 py-1 rounded-full">
                  8 Pending
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                342 days used • 67 days remaining (company)
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                PTO, Sick Leave, Personal Days, Holidays
              </p>
              <div className="text-xs text-[#E74C3C] font-medium">
                View Calendar →
              </div>
            </div>

            {/* Payroll Center */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  Payroll Center
                </h4>
                <span className="text-xs bg-[#27AE60]/20 text-[#27AE60] px-2 py-1 rounded-full">
                  Processed
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                Last run: Dec 15 • Next: Dec 31, 2024
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                Direct deposit, tax documents, pay stubs
              </p>
              <div className="text-xs text-[#D4A017] font-medium">
                View Reports →
              </div>
            </div>

            {/* HR Forms */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#34495E] to-[#2C3E50] flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  HR Forms Library
                </h4>
                <span className="text-xs bg-[#3498DB]/20 text-[#3498DB] px-2 py-1 rounded-full">
                  28 Forms
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                156 downloads this month
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                I-9, W-4, Emergency contacts, Equipment
              </p>
              <div className="text-xs text-[#34495E] font-medium">
                Browse Library →
              </div>
            </div>

            {/* Employee Directory */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#16A085] to-[#1ABC9C] flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  Employee Directory
                </h4>
                <span className="text-xs bg-[#16A085]/20 text-[#16A085] px-2 py-1 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                {staffStats.totalStaff} employees • 6 departments
              </p>
              <p className="text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60 mb-3">
                Searchable contacts, org chart, skills matrix
              </p>
              <div className="text-xs text-[#16A085] font-medium">
                Search Directory →
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                Quick HR Actions
              </h4>
              <div className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Last updated: Dec 28, 2024
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-medium hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative">
                <UserPlus className="w-4 h-4" />
                New Hire Onboarding
                <span className="absolute -top-1 -right-1 bg-[#E74C3C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white font-medium hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative">
                <Star className="w-4 h-4" />
                Schedule Review
                <span className="absolute -top-1 -right-1 bg-[#F39C12] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  8
                </span>
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#F39C12] to-[#D68910] text-white font-medium hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <Clock className="w-4 h-4" />
                Time Off Request
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white font-medium hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <Download className="w-4 h-4" />
                Generate Report
              </button>
            </div>

            {/* Recent Activity */}
            <div className="mt-6 pt-4 border-t border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
              <h5 className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-3">
                Recent HR Activity
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-2 h-2 bg-[#27AE60] rounded-full"></div>
                  <span className="text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Sarah Chen completed onboarding checklist (2 hours ago)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-2 h-2 bg-[#3498DB] rounded-full"></div>
                  <span className="text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Benefits enrollment reminder sent to 12 employees (4 hours
                    ago)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-2 h-2 bg-[#F39C12] rounded-full"></div>
                  <span className="text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Q4 performance reviews due in 3 days (yesterday)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* HR Contact & Support */}
          <div className="bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50 rounded-2xl border border-[#E8D6B5]/50 dark:border-[#3A3A3A] p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h4 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-1">
                  Need HR Support?
                </h4>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                  Contact our HR team for assistance with policies, benefits, or
                  employee relations
                </p>
                <div className="flex flex-col sm:flex-row gap-4 text-xs text-[#8B4513]/60 dark:text-[#D4A017]/60">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Mon-Fri: 8:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    <span>Average response: 2 hours</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017] hover:text-white transition-all duration-200 font-medium">
                  <Mail className="w-4 h-4" />
                  hr@nileflow.com
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-medium hover:shadow-lg transition-all duration-200">
                  <Phone className="w-4 h-4" />
                  Call: (555) 123-4567
                </button>
              </div>
            </div>

            {/* HR Team */}
            <div className="mt-6 pt-4 border-t border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
              <h5 className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] mb-3">
                HR Team Directory
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">JD</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      Jane Doe
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      HR Director
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">MS</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      Mike Smith
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Benefits Specialist
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-[#2A2A2A]/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AL</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      Anna Lee
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Talent Acquisition
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
