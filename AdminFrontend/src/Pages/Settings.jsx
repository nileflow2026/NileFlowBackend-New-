/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../adminService";
import { signoutAdmin } from "../../authService";
import SettingsUpdate from "../components/SettingsUpdate";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Globe,
  Lock,
  Shield,
  LogOut,
  Eye,
  Moon,
  Sun,
  Download,
  Database,
  Users,
  Mail,
  Calendar,
  CreditCard,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit,
  Key,
  Smartphone,
  Globe2,
  BellRing,
  Palette,
  Languages,
  FileText,
  HelpCircle,
  ShieldCheck,
  DatabaseBackup,
  Network,
  Zap,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [showSettingsUpdate, setShowSettingsUpdate] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getProfile();
        setUser(currentUser);
      } catch (err) {
        console.error("Error fetching user:", err.message);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signoutAdmin();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleBackupDatabase = async () => {
    setBackupLoading(true);
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Database backup created successfully", {
        description: "Backup file is ready for download",
      });
    } catch (err) {
      toast.error("Backup failed. Please try again.");
    } finally {
      setBackupLoading(false);
    }
  };

  const settingsTabs = [
    {
      id: "general",
      label: "General",
      icon: <SettingsIcon className="w-4 h-4" />,
    },
    { id: "account", label: "Account", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Palette className="w-4 h-4" />,
    },
    { id: "system", label: "System", icon: <Database className="w-4 h-4" /> },
  ];

  const systemStatus = {
    database: { status: "healthy", color: "bg-[#27AE60]" },
    api: { status: "operational", color: "bg-[#27AE60]" },
    storage: { status: "optimal", color: "bg-[#27AE60]" },
    cache: { status: "active", color: "bg-[#27AE60]" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-[#E8D6B5]/30 dark:bg-[#3A3A3A] rounded-xl"></div>
            <div className="h-32 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"
                ></div>
              ))}
            </div>
            <div className="h-64 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-2xl"></div>
          </div>
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
                Settings & Configuration
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Manage your marketplace configuration, preferences, and system
                settings
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBackupDatabase}
                disabled={backupLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
              >
                {backupLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Backing Up...
                  </>
                ) : (
                  <>
                    <DatabaseBackup className="w-4 h-4" />
                    Backup Database
                  </>
                )}
              </button>
              <button
                onClick={() => setShowSettingsUpdate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <Edit className="w-4 h-4" />
                Edit Settings
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 mb-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                    {user.name || "Administrator"}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                      <span className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                        {user.email}
                      </span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-[#8B4513]/30 dark:bg-[#D4A017]/30"></div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                      <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                        Admin since{" "}
                        {new Date(user.$createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A]">
                  <span className="text-xs font-bold text-[#8B4513] dark:text-[#D4A017] uppercase tracking-wider">
                    {user.role || "Administrator"}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-2 mb-6 shadow-xl">
          <div className="flex overflow-x-auto scrollbar-hide">
            {settingsTabs.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === id
                    ? "bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white shadow-md"
                    : "text-[#8B4513]/70 dark:text-[#D4A017]/70 hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                }`}
              >
                {icon}
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Status */}
            {activeTab === "system" && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                      System Status
                    </h3>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                      Monitor your marketplace infrastructure
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse"></div>
                    <span className="text-sm font-bold text-[#27AE60]">
                      All Systems Operational
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(systemStatus).map(
                    ([key, { status, color }]) => (
                      <div
                        key={key}
                        className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] capitalize">
                            {key}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${color}`}
                          ></div>
                        </div>
                        <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          {status}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* General Settings */}
            {activeTab === "general" && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                      General Application Settings
                    </h3>
                    <div className="space-y-4">
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                            {theme === "dark" ? (
                              <Moon className="w-5 h-5 text-white" />
                            ) : (
                              <Sun className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              Theme
                            </p>
                            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                              {theme === "dark" ? "Dark Mode" : "Light Mode"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm"
                        >
                          Switch Theme
                        </button>
                      </div>

                      {/* Language Settings */}
                      <div
                        onClick={() => navigate("/language-settings")}
                        className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50 hover:bg-white dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                            <Globe2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              Language & Region
                            </p>
                            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                              English (US) • GMT+1 (West Africa Time)
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" />
                      </div>

                      {/* Date & Time Format */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              Date & Time Format
                            </p>
                            <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                              DD/MM/YYYY • 24-hour format
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm">
                          Customize
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Settings */}
            {activeTab === "account" && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  Account Management
                </h3>
                <div className="space-y-4">
                  <div
                    onClick={() => navigate("/profile")}
                    className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50 hover:bg-white dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Profile Information
                        </p>
                        <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          Update your personal details and contact information
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#E67E22] to-[#D35400] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Email Preferences
                        </p>
                        <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A17]/70">
                          Manage newsletter and notification emails
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  Security & Privacy
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Change Password
                        </p>
                        <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          Update your account password regularly
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white text-sm font-semibold hover:shadow-lg transition-all duration-200">
                      Change Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Two-Factor Authentication
                        </p>
                        <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Privacy Settings
                        </p>
                        <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                          Control what information is visible to others
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-sm">
                      Manage Privacy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                      Notification Preferences
                    </h3>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                      Control how and when you receive notifications
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/NotificationsPage")}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white text-sm font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    View All Notifications
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <BellRing className="w-5 h-5 text-[#D4A017]" />
                        <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Push Notifications
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D4A017]/50 dark:peer-focus:ring-[#D4A017]/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D4A017]"></div>
                      </label>
                    </div>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Receive instant push notifications for important updates
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-[#D4A017]" />
                        <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          Email Notifications
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D4A017]/50 dark:peer-focus:ring-[#D4A017]/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D4A017]"></div>
                      </label>
                    </div>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Receive daily and weekly summary emails
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-[#D4A017]" />
                        <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                          SMS Alerts
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D4A017]/50 dark:peer-focus:ring-[#D4A017]/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D4A017]"></div>
                      </label>
                    </div>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Receive critical alerts via SMS
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & System Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors">
                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    Export Settings
                  </span>
                  <Download className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors">
                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    View Documentation
                  </span>
                  <FileText className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors">
                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    Get Support
                  </span>
                  <HelpCircle className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                </button>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                System Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    App Version
                  </span>
                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    v2.4.1
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Last Updated
                  </span>
                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    2 days ago
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Database Size
                  </span>
                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    4.2 GB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                    Active Sessions
                  </span>
                  <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                    3 devices
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Section */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Account Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete your account? This action cannot be undone."
                      )
                    ) {
                      toast.info("Account deletion feature coming soon");
                    }
                  }}
                  className="w-full p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  Delete Account
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout from All Devices
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Update Modal */}
      {showSettingsUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SettingsUpdate onClose={() => setShowSettingsUpdate(false)} />
        </div>
      )}
    </div>
  );
}
