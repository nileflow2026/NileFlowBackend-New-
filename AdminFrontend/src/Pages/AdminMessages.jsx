/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import axiosClient from "../../api";
import {
  Mail,
  User,
  Clock,
  Search,
  Filter,
  Eye,
  Reply,
  Trash2,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Archive,
  Star,
  MoreVertical,
  ChevronRight,
  Inbox,
  Send,
  X,
  Paperclip,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Tag,
  Users,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyEmail, setReplyEmail] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [replyLoading, setReplyLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    replied: 0,
    urgent: 0,
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  // Calculate statistics
  useEffect(() => {
    const total = messages.length;
    const unread = messages.filter((m) => !m.read).length;
    const replied = messages.filter((m) => m.replied).length;
    const urgent = messages.filter((m) => m.priority === "urgent").length;

    setStats({ total, unread, replied, urgent });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(
        "/api/admin/customer-messages/messages"
      );
      setMessages(response.data);
      toast.success("Messages loaded successfully");
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setReplyLoading(true);
    try {
      await axiosClient.post("/api/admin/customer-messages/contact/reply", {
        toEmail: replyEmail,
        subject: `Re: Your message to Nile Mart`,
        message: replyMessage,
      });

      // Update message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.email === replyEmail ? { ...msg, replied: true, read: true } : msg
        )
      );

      toast.success("Reply sent successfully!", {
        description: "Your response has been delivered to the customer",
        duration: 5000,
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      });

      setReplyEmail("");
      setReplyMessage("");
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply", {
        description: error.message || "Please try again",
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      // Update local state immediately
      setMessages((prev) =>
        prev.map((msg) =>
          msg.$id === messageId ? { ...msg, read: true } : msg
        )
      );

      // API call would go here
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleTogglePriority = async (messageId) => {
    try {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.$id === messageId
            ? {
                ...msg,
                priority: msg.priority === "urgent" ? "normal" : "urgent",
              }
            : msg
        )
      );
      toast.info("Priority updated");
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    try {
      // API call to delete would go here
      setMessages((prev) => prev.filter((msg) => msg.$id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const toggleMessageExpand = (messageId) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const toggleSelectMessage = (messageId) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    let filtered = messages.filter((message) => {
      const matchesSearch =
        message.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread"
          ? !message.read
          : statusFilter === "replied"
          ? message.replied
          : true);

      const matchesPriority =
        priorityFilter === "all" || message.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort by date (newest first) and priority
    filtered.sort((a, b) => {
      // Urgent messages first
      if (a.priority === "urgent" && b.priority !== "urgent") return -1;
      if (a.priority !== "urgent" && b.priority === "urgent") return 1;

      // Then by unread status
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;

      // Then by date
      const dateA = new Date(a.$createdAt || a.createdAt || 0);
      const dateB = new Date(b.$createdAt || b.createdAt || 0);
      return dateB - dateA;
    });

    return filtered;
  }, [messages, searchTerm, statusFilter, priorityFilter]);

  // Loading skeleton
  if (loading && messages.length === 0) {
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
                  className="h-24 bg-[#E8D6B5]/20 dark:bg-[#3A3A3A] rounded-xl"
                ></div>
              ))}
            </div>
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
                Customer Messages
              </h1>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                Manage and respond to customer inquiries and feedback
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchMessages}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white dark:hover:bg-[#2A2A2A] transition-all duration-200 font-medium">
                <Archive className="w-4 h-4" />
                Archive All
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
                  Total Messages
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                <Inbox className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Unread Messages
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.unread}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium ${
                stats.unread > 0 ? "text-[#E74C3C]" : "text-[#27AE60]"
              } flex items-center gap-1`}
            >
              {stats.unread > 0 ? "Needs attention" : "All caught up"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Replied
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.replied}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs font-medium text-[#27AE60] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stats.total > 0
                ? `${Math.round(
                    (stats.replied / stats.total) * 100
                  )}% response rate`
                : "No messages"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                  Urgent
                </p>
                <p className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {stats.urgent}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#E74C3C] to-[#C0392B] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              className={`text-xs font-medium ${
                stats.urgent > 0 ? "text-[#E74C3C]" : "text-[#27AE60]"
              } flex items-center gap-1`}
            >
              {stats.urgent > 0
                ? "Requires immediate action"
                : "No urgent messages"}
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
                placeholder="Search messages by name, email, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="replied">Replied</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                className="px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/80 dark:hover:bg-[#2A2A2A]/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5]/30 dark:border-[#3A3A3A] overflow-hidden shadow-xl">
          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-[#E8D6B5] dark:text-[#3A3A3A] mx-auto mb-4" />
              <p className="text-[#8B4513]/70 dark:text-[#D4A017]/70 mb-2">
                No messages found
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ||
                statusFilter !== "all" ||
                priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "All customer messages have been addressed"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8D6B5]/30 dark:divide-[#3A3A3A]">
              {filteredMessages.map((message) => {
                const isExpanded = expandedMessages.has(message.$id);
                const isSelected = selectedMessages.has(message.$id);
                const isUrgent = message.priority === "urgent";
                const isUnread = !message.read;
                const isReplied = message.replied;

                return (
                  <div
                    key={message.$id}
                    className={`transition-all duration-200 ${
                      isSelected
                        ? "bg-[#E8D6B5]/10 dark:bg-[#3A3A3A]/30"
                        : "hover:bg-[#E8D6B5]/10 dark:hover:bg-[#3A3A3A]/20"
                    }`}
                  >
                    {/* Message Header */}
                    <div className="p-4 md:p-6">
                      <div className="flex items-start gap-4">
                        {/* Select Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectMessage(message.$id)}
                            className="rounded border-[#E8D6B5] text-[#D4A017] focus:ring-[#D4A017]"
                          />
                        </div>

                        {/* Message Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
                                    {message.username}
                                  </h3>
                                  {isUrgent && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white text-xs font-bold rounded-full">
                                      URGENT
                                    </span>
                                  )}
                                  {isUnread && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white text-xs font-bold rounded-full">
                                      NEW
                                    </span>
                                  )}
                                  {isReplied && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white text-xs font-bold rounded-full">
                                      REPLIED
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Mail className="w-3 h-3 text-gray-500" />
                                  <a
                                    href={`mailto:${message.email}`}
                                    className="text-sm text-[#8B4513] dark:text-[#D4A017] hover:underline"
                                  >
                                    {message.email}
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {new Date(
                                  message.$createdAt
                                ).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => toggleMessageExpand(message.$id)}
                                className="p-1.5 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                              >
                                <ChevronDown
                                  className={`w-4 h-4 text-[#8B4513] dark:text-[#D4A017] transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Message Preview */}
                          <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3] line-clamp-2">
                            {message.message}
                          </p>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-3 mt-4">
                            <button
                              onClick={() => {
                                setSelectedMessage(message);
                                setReplyEmail(message.email);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white text-xs font-semibold hover:shadow-lg transition-all duration-200"
                            >
                              <Reply className="w-3 h-3" />
                              Reply
                            </button>
                            <button
                              onClick={() => handleMarkAsRead(message.$id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] text-xs font-medium hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Mark as Read
                            </button>
                            <button
                              onClick={() => handleTogglePriority(message.$id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] text-xs font-medium hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
                            >
                              {isUrgent ? (
                                <>
                                  <Star className="w-3 h-3 fill-[#E8D6B5]" />
                                  Normal Priority
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3" />
                                  Mark Urgent
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.$id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8D6B5] dark:border-[#3A3A3A] text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Message Content */}
                      {isExpanded && (
                        <div className="mt-4 pl-14">
                          <div className="p-4 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white/50 dark:bg-[#2A2A2A]/50">
                            <div className="mb-3">
                              <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-2">
                                Full Message
                              </h4>
                              <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3] whitespace-pre-wrap">
                                {message.message}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#E8D6B5] dark:border-[#3A3A3A]">
                              <div>
                                <p className="text-xs text-[#8B4513] dark:text-[#D4A017] font-medium mb-1">
                                  Received
                                </p>
                                <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                                  {new Date(
                                    message.$createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-[#8B4513] dark:text-[#D4A017] font-medium mb-1">
                                  Status
                                </p>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      isUnread
                                        ? "bg-[#3498DB] animate-pulse"
                                        : "bg-[#27AE60]"
                                    }`}
                                  ></div>
                                  <span className="text-sm text-[#2C1810] dark:text-[#F5E6D3]">
                                    {isUnread ? "Unread" : "Read"}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-[#8B4513] dark:text-[#D4A017] font-medium mb-1">
                                  Action
                                </p>
                                <button
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    setReplyEmail(message.email);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white text-xs font-semibold hover:shadow-lg transition-all duration-200"
                                >
                                  <Send className="w-3 h-3" />
                                  Reply Now
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedMessages.size > 0 && (
          <div className="mt-6 p-4 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A]/50 dark:to-[#3A3A3A]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {selectedMessages.size}
                  </span>
                </div>
                <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                  {selectedMessages.size} message
                  {selectedMessages.size === 1 ? "" : "s"} selected
                </span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
                  Mark as Read
                </button>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Reply to All
                </button>
                <button className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#1A1A1A] dark:to-[#2A2A2A] rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] w-full max-w-2xl shadow-2xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#E8D6B5] dark:border-[#3A3A3A]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                      Reply to {selectedMessage.username}
                    </h3>
                    <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70 mt-1">
                      Send a response to this customer inquiry
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMessage(null);
                      setReplyEmail("");
                      setReplyMessage("");
                    }}
                    className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                  >
                    <X className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" />
                  </button>
                </div>
              </div>

              {/* Original Message */}
              <div className="p-6 border-b border-[#E8D6B5] dark:border-[#3A3A3A]">
                <h4 className="text-sm font-semibold text-[#8B4513] dark:text-[#D4A017] mb-2">
                  Original Message
                </h4>
                <div className="p-4 rounded-xl bg-white/50 dark:bg-[#2A2A2A]/50 border border-[#E8D6B5] dark:border-[#3A3A3A]">
                  <p className="text-sm text-[#2C1810] dark:text-[#F5E6D3] whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E8D6B5] dark:border-[#3A3A3A]">
                    <span className="text-xs text-gray-500">
                      From: {selectedMessage.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      Email: {selectedMessage.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      Date:{" "}
                      {new Date(
                        selectedMessage.$createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReply} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                      Reply To Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] dark:text-[#D4A017]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={replyEmail}
                        onChange={(e) => setReplyEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent"
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017] mb-2">
                      Your Reply *
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-white dark:bg-[#2A2A2A] text-[#2C1810] dark:text-[#F5E6D3] placeholder-[#8B4513]/50 dark:placeholder-[#D4A017]/50 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 focus:border-transparent min-h-[150px]"
                      rows="5"
                      placeholder="Type your response here..."
                      required
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70">
                        Your reply will be sent to {selectedMessage.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                          title="Attach file"
                        >
                          <Paperclip className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors"
                          title="Add template"
                        >
                          <Tag className="w-4 h-4 text-[#8B4513] dark:text-[#D4A017]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMessage(null);
                      setReplyEmail("");
                      setReplyMessage("");
                    }}
                    className="px-5 py-2.5 rounded-xl border border-[#E8D6B5] dark:border-[#3A3A3A] text-[#8B4513] dark:text-[#D4A017] hover:bg-white/50 dark:hover:bg-[#2A2A2A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {replyLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-8 p-6 rounded-2xl border border-[#E8D6B5] dark:border-[#3A3A3A] bg-gradient-to-r from-[#E8D6B5]/10 to-[#D4A017]/5 dark:from-[#3A3A3A]/30 dark:to-[#2A2A2A]/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
                Need help managing messages?
              </p>
              <p className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                Check our response templates and best practices
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white font-semibold hover:shadow-lg transition-all duration-200">
              <MessageSquare className="w-4 h-4" />
              View Response Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
