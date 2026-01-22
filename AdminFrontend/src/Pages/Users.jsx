import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchUsers } from "../../adminService";
import { Config, databases } from "../../appwrite";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  UserX,
  UserCheck,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Mail,
  Shield,
  Calendar,
  Download,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [dbUsers, setDbUsers] = useState([]); // Store direct database users for ID comparison

  const itemsPerPage = 10;

  // Helper function to get the correct database ID for a user
  const getCorrectUserId = (apiUser) => {
    const dbUser = dbUsers.find((db) => db.email === apiUser.email);
    if (dbUser && dbUser.$id !== apiUser.$id) {
      console.warn(
        `Using corrected DB ID ${dbUser.$id} instead of API ID ${apiUser.$id} for user ${apiUser.email}`
      );
      return dbUser.$id;
    }
    return apiUser.$id;
  };

  // Fetch users with error handling
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("=== DEBUGGING USER FETCH FROM API ===");

        // Get users from API
        const usersData = await fetchUsers();
        console.log(
          "Users from API:",
          usersData.map((u) => ({
            id: u.$id,
            username: u.username,
            email: u.email,
          }))
        );
        setUsers(usersData);

        // Also check direct database to compare
        try {
          const { databases, Config } = await import("../../appwrite");
          const directUsers = await databases.listDocuments(
            Config.databaseId,
            Config.userCollectionId,
            [],
            100
          );
          console.log(
            "Users from direct DB:",
            directUsers.documents.map((u) => ({
              id: u.$id,
              username: u.username,
              email: u.email,
            }))
          );
          setDbUsers(directUsers.documents); // Store for ID mapping

          // Compare IDs
          console.log("=== API vs DATABASE ID COMPARISON ===");
          usersData.forEach((apiUser) => {
            const dbUser = directUsers.documents.find(
              (db) => db.email === apiUser.email
            );
            if (dbUser && dbUser.$id !== apiUser.$id) {
              console.warn(`⚠️ ID MISMATCH for user ${apiUser.email}:`);
              console.warn(`  - API ID: ${apiUser.$id}`);
              console.warn(`  - DB ID: ${dbUser.$id}`);
              console.warn(
                `  - Clicking this user will navigate to /users/${apiUser.$id} but should be /users/${dbUser.$id}`
              );
            }
          });
        } catch (dbError) {
          console.error("Could not check direct database:", dbError);
        }
      } catch (err) {
        console.error("Error loading users:", err);
        setError(err);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      const matchesSearch =
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.$id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        roleFilter === "all" || user.role?.toLowerCase() === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? user.isActive !== false
          : user.isActive === false);

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
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
  }, [users, searchTerm, roleFilter, statusFilter, sortConfig]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Handle user deletion with confirmation
  const handleDelete = useCallback(async (userId, username) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${username || "this user"}?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await databases.deleteDocument(
        Config.databaseId,
        Config.userCollectionId,
        userId
      );

      setUsers((prev) => prev.filter((user) => user.$id !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  }, []);

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.warning("No users selected");
      return;
    }

    if (!window.confirm(`Delete ${selectedUsers.size} selected users?`)) {
      return;
    }

    setIsDeleting(true);
    const deletePromises = Array.from(selectedUsers).map((userId) =>
      databases.deleteDocument(
        Config.databaseId,
        Config.userCollectionId,
        userId
      )
    );

    try {
      await Promise.all(deletePromises);
      setUsers((prev) => prev.filter((user) => !selectedUsers.has(user.$id)));
      setSelectedUsers(new Set());
      toast.success(`${selectedUsers.size} users deleted successfully`);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      toast.error("Failed to delete some users");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  // Select all on current page
  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((user) => user.$id)));
    }
  }, [paginatedUsers]);

  // Role badge component
  const getRoleBadge = useCallback((role) => {
    const roleConfig = {
      admin: {
        bg: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
        text: "text-white",
        label: "Admin",
      },
      customer: {
        bg: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
        text: "text-white",
        label: "Customer",
      },
      seller: {
        bg: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
        text: "text-white",
        label: "Seller",
      },
      staff: {
        bg: "bg-gradient-to-r from-[#E67E22] to-[#D35400]",
        text: "text-white",
        label: "Staff",
      },
    };

    const config = roleConfig[role?.toLowerCase()] || {
      bg: "bg-gradient-to-r from-[#7F8C8D] to-[#616A6B]",
      text: "text-white",
      label: role || "User",
    };

    return (
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text} shadow-sm`}
      >
        {config.label}
      </span>
    );
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl"></div>
          <div className="h-12 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-8 shadow-xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
            Failed to Load Users
          </h3>
          <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-6">
            {error.message || "An error occurred while loading users"}
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
              User Management
            </h2>
            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
              Manage all marketplace users, roles, and permissions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
              <UserCheck className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FFF9E6] to-[#FFEBB2] dark:from-[#3A2C1A] dark:to-[#2A1C0A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Users
                </p>
                <p className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {users.length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#1A2C1A] dark:to-[#0A1C0A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Active Users
                </p>
                <p className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {users.filter((u) => u.isActive !== false).length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#E8F4FD] to-[#C8E6F5] dark:from-[#1A2A3A] dark:to-[#0A1A2A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Admins
                </p>
                <p className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] dark:from-[#2A1A3A] dark:to-[#1A0A2A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  New Today
                </p>
                <p className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {
                    users.filter((u) => {
                      const today = new Date();
                      const created = new Date(u.$createdAt || u.createdAt);
                      return created.toDateString() === today.toDateString();
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search users by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="staff">Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/80 dark:hover:bg-[#2A2A2A]/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center justify-between p-4 mb-6 rounded-xl bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A]/50 dark:to-[#3A3A3A]/30 border border-[#E8D6B5] dark:border-[#3A3A3A]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {selectedUsers.size}
                </span>
              </div>
              <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                {selectedUsers.size} user{selectedUsers.size === 1 ? "" : "s"}{" "}
                selected
              </span>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
                Activate
              </button>
              <button className="px-4 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors">
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A]/50">
                <th className="px-6 py-4 text-left">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        paginatedUsers.length > 0 &&
                        selectedUsers.size === paginatedUsers.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                    />
                  </label>
                </th>
                {[
                  { key: "username", label: "User" },
                  { key: "email", label: "Email" },
                  { key: "role", label: "Role" },
                  { key: "createdAt", label: "Joined" },
                  { key: "status", label: "Status" },
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
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.$id}
                    className="hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.$id)}
                          onChange={() => toggleUserSelection(user.$id)}
                          className="rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                        />
                      </label>
                    </td>

                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.username
                            )}&background=D4A017&color=fff&bold=true`
                          }
                          alt={user.username}
                          className="w-10 h-10 rounded-full border-2 border-[#E8D6B5] dark:border-[#3A3A3A] object-cover shadow-sm"
                        />
                        <div>
                          <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                            {user.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            #{user.$id.substring(0, 8)}...
                          </p>
                          {/* Debug: Show if this ID matches database */}
                          <p
                            className="text-xs font-mono"
                            title={`Full API ID: ${user.$id}`}
                          >
                            {getCorrectUserId(user) !== user.$id ? (
                              <>
                                <span className="text-red-500">
                                  🐛 API: {user.$id.substring(0, 8)}...
                                </span>
                                <br />
                                <span className="text-green-500">
                                  ✓ DB: {getCorrectUserId(user).substring(0, 8)}
                                  ...
                                </span>
                              </>
                            ) : (
                              <span className="text-green-500">
                                ✓ ID: {user.$id.substring(0, 8)}...
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${user.email}`}
                          className="text-sm text-[#2C1810] dark:text-[#F5E6D3] hover:text-[#D4A017] dark:hover:text-[#FFD700] transition-colors truncate max-w-xs"
                        >
                          {user.email}
                        </a>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>

                    {/* Joined Date */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                        {new Date(user.$createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            user.isActive !== false
                              ? "bg-[#27AE60] animate-pulse"
                              : "bg-[#E74C3C]"
                          }`}
                        ></div>
                        <span
                          className={`text-xs font-semibold ${
                            user.isActive !== false
                              ? "text-[#27AE60]"
                              : "text-[#E74C3C]"
                          }`}
                        >
                          {user.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            const correctId = getCorrectUserId(user);
                            console.log(
                              `Navigating to user profile with ID: ${correctId}`
                            );
                            navigate(`/users/${correctId}`);
                          }}
                          className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                          title={`View Profile (Using ${
                            getCorrectUserId(user) !== user.$id
                              ? "corrected DB ID"
                              : "API ID"
                          })`}
                        >
                          <Eye className="w-4 h-4 text-[#3498DB]" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4 text-[#D4A017]" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.$id, user.username)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4 text-[#E74C3C]" />
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
                      No users found
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ||
                      roleFilter !== "all" ||
                      statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No users in the system yet"}
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Showing{" "}
                <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAndSortedUsers.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                  {filteredAndSortedUsers.length}
                </span>{" "}
                users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
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
                        className={`w-8 h-8 rounded-lg ${
                          currentPage === pageNumber
                            ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white"
                            : "text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                        } transition-colors`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 rounded-lg text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
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
                  className="px-3 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
