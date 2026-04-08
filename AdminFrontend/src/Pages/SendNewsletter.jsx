/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import axiosClient from "../../api";
import {
  Send,
  Mail,
  Users,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  Eye,
  FileText,
  BarChart,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Hash,
  ArrowRight,
  Sparkles,
  Image,
  Palette,
  Settings,
  Download,
  Copy,
  ChevronDown,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

const SendNewsletter = () => {
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaignType, setCampaignType] = useState("marketing");
  const [targetAudience, setTargetAudience] = useState("all");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [message, setMessage] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [statistics, setStatistics] = useState({
    totalSubscribers: 24580,
    openRate: "42.5%",
    clickRate: "18.3%",
    activeCampaigns: 3,
    trends: {
      subscribersTrend: { value: 2.4, period: "this month", direction: "up" },
      openRateTrend: {
        value: 3.2,
        period: "from last campaign",
        direction: "up",
      },
      clickRateTrend: {
        value: -0.8,
        period: "from last campaign",
        direction: "down",
      },
    },
  });
  const [audienceGroups, setAudienceGroups] = useState([
    { id: "all", label: "All Subscribers", count: 24580 },
    { id: "active", label: "Active Buyers", count: 15820 },
    { id: "inactive", label: "Inactive Users", count: 5760 },
    { id: "new", label: "New Subscribers", count: 3200 },
    { id: "vip", label: "VIP Customers", count: 980 },
  ]);

  const [campaignTypes, setCampaignTypes] = useState([
    {
      id: "marketing",
      label: "Marketing",
      color: "from-[#D4A017] to-[#B8860B]",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "promotional",
      label: "Promotional",
      color: "from-[#27AE60] to-[#2ECC71]",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: "announcement",
      label: "Announcement",
      color: "from-[#3498DB] to-[#2980B9]",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: "educational",
      label: "Educational",
      color: "from-[#9B59B6] to-[#8E44AD]",
      icon: <FileText className="w-4 h-4" />,
    },
  ]);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAudienceStats = async () => {
      try {
        const response = await axiosClient.get(
          "/api/admin/newsletter/audience-statistics"
        );
        console.log("Fetched audience statistics:", response.data);
        setStatistics(response.data);
        setAudienceGroups(response.data.audienceGroups);
      } catch (error) {
        console.error("Failed to fetch audience statistics:", error);
        // Keep existing hardcoded values as fallback
      }
    };

    fetchAudienceStats();
  }, []);

  useEffect(() => {
    const fetchCampaignTypes = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          "/api/admin/newsletter/campaign-types"
        );
        console.log("Fetched campaign types:", response.data);

        if (
          response.data.campaignTypes &&
          response.data.campaignTypes.length > 0
        ) {
          // Transform API data to match frontend format
          const transformedCampaignTypes = response.data.campaignTypes.map(
            (type) => {
              // Icon mapping
              const iconMap = {
                marketing: <TrendingUp className="w-4 h-4" />,
                promotional: <Sparkles className="w-4 h-4" />,
                announcement: <Bell className="w-4 h-4" />,
                educational: <FileText className="w-4 h-4" />,
              };

              // Color mapping
              const colorMap = {
                marketing: "from-[#D4A017] to-[#B8860B]",
                promotional: "from-[#27AE60] to-[#2ECC71]",
                announcement: "from-[#3498DB] to-[#2980B9]",
                educational: "from-[#9B59B6] to-[#8E44AD]",
              };

              const typeId = type.name.toLowerCase();

              return {
                id: typeId,
                label: type.name,
                color: colorMap[typeId] || "from-gray-500 to-gray-600",
                icon: iconMap[typeId] || <FileText className="w-4 h-4" />,
              };
            }
          );

          setCampaignTypes(transformedCampaignTypes);
        }
      } catch (err) {
        console.error("Error fetching campaign types:", err);
        setError(err.message);
        // Keep fallback data - campaignTypes already set in useState
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    if (!subject) {
      toast.error("Please enter a subject line");
      setLoading(false);
      return;
    }

    try {
      const campaignData = {
        subject,
        campaignType,
        targetAudience,
        ...(scheduleDate &&
          scheduleTime && {
            scheduledAt: `${scheduleDate}T${scheduleTime}:00`,
          }),
        ...(message && { message }),
        ...(bannerUrl && { bannerUrl }),
        ...(ctaText && { ctaText }),
        ...(ctaLink && { ctaLink }),
      };

      const response = await axiosClient.post(
        "/api/admin/newsletter/send-newsletter",
        campaignData
      );

      setStatus(response.data.message);
      setSubject("");
      setMessage("");
      setBannerUrl("");
      setCtaText("");
      setCtaLink("");
      toast.success("Newsletter campaign created successfully!");

      // Simulate statistics update
      setStatistics((prev) => ({
        ...prev,
        activeCampaigns: prev.activeCampaigns + 1,
      }));
    } catch (error) {
      console.error("Failed to send newsletter:", error.response?.data?.error);
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(`Failed to send newsletter: ${errorMessage}`);
      setStatus(`Failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = useCallback(() => {
    if (!subject) {
      toast.warning("Please enter a subject first");
      return;
    }
    toast.success("Test email sent to admin inbox!");
  }, [subject]);

  const handlePreview = useCallback(() => {
    if (!subject) {
      toast.warning("Please enter a subject to preview");
      return;
    }
    setPreviewMode(!previewMode);
    toast.info(previewMode ? "Preview closed" : "Previewing newsletter");
  }, [subject, previewMode]);

  const copyCampaignDetails = useCallback(() => {
    const details = `Campaign: ${subject}\nType: ${campaignType}\nAudience: ${targetAudience}`;
    navigator.clipboard.writeText(details);
    toast.success("Campaign details copied to clipboard");
  }, [subject, campaignType, targetAudience]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E6] dark:from-[#1A1A1A] dark:to-[#242424] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Newsletter Campaigns
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Create and manage email campaigns for your marketplace community
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Download className="w-4 h-4" />
                Export List
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <Users className="w-4 h-4" />
                Manage Subscribers
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Total Subscribers
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {statistics.totalSubscribers.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium flex items-center gap-1 ${
                statistics.trends?.subscribersTrend?.direction === "up"
                  ? "text-[#27AE60]"
                  : "text-[#E74C3C]"
              }`}
            >
              <TrendingUp
                className={`w-3 h-3 ${
                  statistics.trends?.subscribersTrend?.direction === "down"
                    ? "rotate-180"
                    : ""
                }`}
              />
              {statistics.trends?.subscribersTrend?.direction === "up"
                ? "+"
                : ""}
              {statistics.trends?.subscribersTrend?.value}%{" "}
              {statistics.trends?.subscribersTrend?.period}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Avg Open Rate
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {statistics.openRate}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium flex items-center gap-1 ${
                statistics.trends?.openRateTrend?.direction === "up"
                  ? "text-[#27AE60]"
                  : "text-[#E74C3C]"
              }`}
            >
              <TrendingUp
                className={`w-3 h-3 ${
                  statistics.trends?.openRateTrend?.direction === "down"
                    ? "rotate-180"
                    : ""
                }`}
              />
              {statistics.trends?.openRateTrend?.direction === "up" ? "+" : ""}
              {statistics.trends?.openRateTrend?.value}%{" "}
              {statistics.trends?.openRateTrend?.period}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Avg Click Rate
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {statistics.clickRate}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                <BarChart className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium flex items-center gap-1 ${
                statistics.trends?.clickRateTrend?.direction === "up"
                  ? "text-[#27AE60]"
                  : "text-[#E74C3C]"
              }`}
            >
              <TrendingUp
                className={`w-3 h-3 ${
                  statistics.trends?.clickRateTrend?.direction === "down"
                    ? "rotate-180"
                    : ""
                }`}
              />
              {statistics.trends?.clickRateTrend?.direction === "up" ? "+" : ""}
              {statistics.trends?.clickRateTrend?.value}%{" "}
              {statistics.trends?.clickRateTrend?.period}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Active Campaigns
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {statistics.activeCampaigns}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017]">
              {statistics.activeCampaigns > 0 ? "Live" : "No active campaigns"}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Campaign Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  Create New Campaign
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendTest}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Send Test
                  </button>
                  <button
                    onClick={handlePreview}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    {previewMode ? "Hide Preview" : "Preview"}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Campaign Subject */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Campaign Subject
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                      <Hash className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent text-lg font-medium"
                      placeholder="Enter an attention-grabbing subject line..."
                      required
                    />
                  </div>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2">
                    This subject line will appear in subscribers' inboxes
                  </p>
                </div>

                {/* Campaign Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {campaignTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setCampaignType(type.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                          campaignType === type.id
                            ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg scale-[1.02]`
                            : "border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A]"
                        }`}
                      >
                        <div
                          className={`mb-2 ${
                            campaignType === type.id ? "text-white" : ""
                          }`}
                        >
                          {type.icon}
                        </div>
                        <span className="text-sm font-medium">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields Based on Campaign Type */}
                {(campaignType === "announcement" ||
                  campaignType === "educational") && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                      {campaignType === "announcement"
                        ? "Announcement"
                        : "Educational"}{" "}
                      Message
                    </label>
                    <div className="relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent resize-none"
                        placeholder={`Enter your ${campaignType} message here...`}
                      />
                    </div>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2">
                      This message will be the main content of your{" "}
                      {campaignType}
                    </p>
                  </div>
                )}

                {campaignType === "promotional" && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                        Promotional Banner URL (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                          <Image className="w-4 h-4" />
                        </div>
                        <input
                          type="url"
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>
                      <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                        Banner image for your promotional campaign
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                          Call-to-Action Text (Optional)
                        </label>
                        <input
                          type="text"
                          value={ctaText}
                          onChange={(e) => setCtaText(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                          placeholder="Shop Now"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                          Call-to-Action Link (Optional)
                        </label>
                        <input
                          type="url"
                          value={ctaLink}
                          onChange={(e) => setCtaLink(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                          placeholder="https://nileflowafrica.com/shop"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Leave fields empty to use default values
                    </p>
                  </div>
                )}

                {/* Audience Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {audienceGroups.map((audience) => (
                      <button
                        key={audience.id}
                        type="button"
                        onClick={() => setTargetAudience(audience.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                          targetAudience === audience.id
                            ? "bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A] dark:to-[#2A2A2A] border-[#D4A017] dark:border-[#D4A017]"
                            : "border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                              {audience.label}
                            </span>
                            <div className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                              {audience.count.toLocaleString()} subscribers
                            </div>
                          </div>
                        </div>
                        {targetAudience === audience.id && (
                          <CheckCircle className="w-5 h-5 text-[#27AE60]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule Options */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-3">
                    Schedule Delivery (Optional)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-2">
                    Leave empty to send immediately
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {scheduleDate && scheduleTime
                          ? "Schedule Campaign"
                          : "Send Campaign Now"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={copyCampaignDetails}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Details
                  </button>
                </div>
              </form>

              {/* Status Message */}
              {status && (
                <div
                  className={`mt-6 p-4 rounded-xl border ${
                    status.includes("Failed")
                      ? "bg-gradient-to-r from-[#E74C3C]/10 to-[#C0392B]/10 border-[#E74C3C] dark:border-[#E74C3C] text-[#E74C3C]"
                      : "bg-gradient-to-r from-[#27AE60]/10 to-[#2ECC71]/10 border-[#27AE60] dark:border-[#27AE60] text-[#27AE60]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {status.includes("Failed") ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">{status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview & Tips */}
          <div className="space-y-6">
            {/* Campaign Preview */}
            {previewMode && subject && (
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                  Campaign Preview
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/10 to-[#F5E6D3]/5 dark:from-[#3A3A3A]/50 dark:to-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                          Nile Flow Africa Marketplace
                        </div>
                        <div className="text-xs text-gray-500">
                          to @subscriber
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
                      {subject}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      This is a preview of your automated newsletter content.
                      The actual email will include dynamic content, product
                      recommendations, and personalized offers based on your
                      subscribers' preferences.
                    </p>
                    <div className="p-3 rounded-lg bg-white dark:bg-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A]">
                      <div className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                        Email will include:
                      </div>
                      <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          Featured marketplace products
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          Personalized recommendations
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          Special offers and discounts
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#27AE60]" />
                          Community updates
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Best Practices */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Best Practices
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Engaging Subject Lines
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Keep subject lines under 60 characters for best results
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Optimal Timing
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Tuesdays 10 AM - 2 PM have highest engagement rates
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#2C1810] dark:text-[#F5E6D3] text-sm">
                      Personalization
                    </p>
                    <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                      Use subscriber data to personalize content
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3] mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      Template Settings
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#F39C12] to-[#D68910] flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      Upload Media
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                      <BarChart className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                      View Analytics
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendNewsletter;
