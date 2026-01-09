import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Assuming you are using React Router
import axiosClient from "../../api";
import {
  Sparkles,
  Users,
  Target,
  Heart,
  Zap,
  Globe,
  Award,
  ChevronDown,
  ChevronUp,
  Search,
  MapPin,
  Clock,
  TrendingUp,
  BookOpen,
  Shield,
  Coffee,
  Send,
  Star,
  Trophy,
  Compass,
  Rocket,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
const Careers = () => {
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredJobs = jobListings
    .filter(
      (job) =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (job) =>
        activeFilter === "all" ||
        job.department.toLowerCase() === activeFilter.toLowerCase()
    );

  const departments = [
    {
      id: "all",
      name: "All Departments",
      icon: <Globe className="w-4 h-4" />,
      color: "from-amber-500 to-yellow-500",
    },
    {
      id: "tech",
      name: "Technology",
      icon: <Zap className="w-4 h-4" />,
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "marketing",
      name: "Marketing",
      icon: <Target className="w-4 h-4" />,
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "operations",
      name: "Operations",
      icon: <Shield className="w-4 h-4" />,
      color: "from-emerald-500 to-green-500",
    },
    {
      id: "design",
      name: "Design",
      icon: <Sparkles className="w-4 h-4" />,
      color: "from-purple-500 to-violet-500",
    },
    {
      id: "support",
      name: "Customer Support",
      icon: <Heart className="w-4 h-4" />,
      color: "from-red-500 to-orange-500",
    },
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axiosClient.get("/api/admin/careers");
        const careersData = response.data.data;
        setJobListings(careersData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col justify-center items-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
        </div>
        <h3 className="mt-6 text-xl font-bold text-amber-200">
          Discovering Opportunities
        </h3>
        <p className="text-gray-400 mt-2">
          Loading exciting career paths at Nile Flow...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col justify-center items-center">
        <div className="bg-gradient-to-br from-red-900/30 to-amber-900/30 border border-red-700/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Connection Error
          </h3>
          <p className="text-gray-300 mb-6">
            Unable to load career opportunities. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-emerald-900/20 to-blue-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Rocket className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Career Opportunities
            </span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-emerald-200 to-blue-200 bg-clip-text text-transparent">
              Build Africa's Future
            </span>
            <br />
            <span className="text-white">With Nile Flow</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-10">
            Join a movement that's redefining African e-commerce. Work with
            passionate innovators to create premium experiences that celebrate
            African culture and craftsmanship.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-30"></div>
              <div className="relative flex bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-2xl overflow-hidden">
                <div className="pl-5 pr-3 flex items-center">
                  <Search className="w-5 h-5 text-amber-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search roles (e.g., Frontend Developer, Marketing Manager)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-4 bg-transparent text-amber-100 placeholder-amber-100/50 focus:outline-none text-lg"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">
                {jobListings.length}
              </div>
              <div className="text-amber-100/80 text-sm">Open Positions</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">100%</div>
              <div className="text-emerald-100/80 text-sm">Remote Friendly</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">Flexible</div>
              <div className="text-blue-100/80 text-sm">Work Hours</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-purple-300">Premium</div>
              <div className="text-purple-100/80 text-sm">Benefits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Nile Flow */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
              <Heart className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200 font-medium tracking-wide">
                Why Join Us
              </span>
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Build More Than a Career
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                African Impact
              </h3>
              <p className="text-gray-300">
                Shape the future of e-commerce across Africa with products that
                celebrate cultural heritage.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Rapid Growth
              </h3>
              <p className="text-gray-300">
                Fast-track your career in a dynamic startup environment with
                direct impact on key decisions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Continuous Learning
              </h3>
              <p className="text-gray-300">
                Access premium training, mentorship programs, and conference
                opportunities.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-800/30 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Elite Team</h3>
              <p className="text-gray-300">
                Work with Africa's brightest minds passionate about technology
                and cultural preservation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Department Filters */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/20 to-black/20">
        <div className="relative max-w-8xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Browse by Department
            </h3>
            <p className="text-gray-300">
              Find your perfect role in our growing team
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setActiveFilter(dept.id)}
                className={`group relative p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                  activeFilter === dept.id
                    ? `bg-gradient-to-r ${dept.color} border-transparent text-white shadow-lg`
                    : "bg-gradient-to-br from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                }`}
              >
                {activeFilter === dept.id && (
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r ${dept.color.replace(
                      "500",
                      "300"
                    )} rounded-2xl blur opacity-30`}
                  ></div>
                )}
                <div className="relative mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${
                      activeFilter === dept.id
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-gray-900 to-black border border-amber-700/30"
                    } flex items-center justify-center mx-auto`}
                  >
                    <span
                      className={
                        activeFilter === dept.id
                          ? "text-white"
                          : "text-amber-400"
                      }
                    >
                      {dept.icon}
                    </span>
                  </div>
                </div>
                <div className="relative text-sm font-medium">{dept.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Open Positions
              </h2>
              <p className="text-gray-300">
                Showing{" "}
                <span className="text-amber-300 font-bold">
                  {filteredJobs.length}
                </span>{" "}
                of{" "}
                <span className="text-amber-300 font-bold">
                  {jobListings.length}
                </span>{" "}
                opportunities
              </p>
            </div>
            <div className="text-amber-200">
              <Clock className="w-5 h-5 inline mr-2" />
              Updated daily
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                <Search className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Matching Positions
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                {searchTerm
                  ? `No positions match "${searchTerm}". Try a different search term or browse all departments.`
                  : "No positions available in this department currently. Check back soon!"}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilter("all");
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
              >
                View All Positions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredJobs.map((job, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
                >
                  {/* Background Glow */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      departments
                        .find((d) => d.id === job.department?.toLowerCase())
                        ?.color.replace("500", "500") ||
                      "from-amber-500 to-yellow-500"
                    }/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Job Card */}
                  <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30">
                    {job.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={job.image}
                          alt={`${job.title} at Nile Flow`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

                        {/* Department Badge */}
                        <div className="absolute top-4 left-4 z-10">
                          <div
                            className={`px-4 py-2 bg-gradient-to-r ${
                              departments.find(
                                (d) => d.id === job.department?.toLowerCase()
                              )?.color || "from-amber-600 to-yellow-600"
                            } text-white text-sm font-bold rounded-full shadow-lg`}
                          >
                            {job.department || "General"}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors duration-300 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-amber-200 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location || "Remote"}
                            </span>
                            <span className="text-emerald-200 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {job.type || "Full-time"}
                            </span>
                          </div>
                        </div>

                        <div className="text-amber-400">
                          {departments.find(
                            (d) => d.id === job.department?.toLowerCase()
                          )?.icon || <Compass className="w-6 h-6" />}
                        </div>
                      </div>

                      <p className="text-gray-300 mb-6 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() =>
                            setSelectedJob(selectedJob === index ? null : index)
                          }
                          className="text-amber-400 hover:text-amber-300 transition-colors duration-300 flex items-center space-x-2"
                        >
                          <span>
                            {selectedJob === index
                              ? "Hide Details"
                              : "View Details"}
                          </span>
                          {selectedJob === index ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <Link
                          to={`/apply/${job.$id}`}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center space-x-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>Apply Now</span>
                        </Link>
                      </div>

                      {/* Job Details Expandable */}
                      {selectedJob === index && (
                        <div className="mt-6 pt-6 border-t border-amber-800/30 space-y-6 animate-fadeIn">
                          {/* Responsibilities */}
                          {job.responsibilities && (
                            <div>
                              <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                                <Target className="w-5 h-5 text-amber-400 mr-2" />
                                Responsibilities
                              </h4>
                              <ul className="space-y-2">
                                {JSON.parse(job.responsibilities).map(
                                  (responsibility, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start space-x-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 mt-2"></div>
                                      <span className="text-gray-300">
                                        {responsibility}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Requirements */}
                          {job.requirements && (
                            <div>
                              <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                                <Shield className="w-5 h-5 text-blue-400 mr-2" />
                                Requirements
                              </h4>
                              <ul className="space-y-2">
                                {JSON.parse(job.requirements).map(
                                  (requirement, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start space-x-2"
                                    >
                                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 mt-2"></div>
                                      <span className="text-gray-300">
                                        {requirement}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Growth Path */}
                          {job.growthPath && (
                            <div>
                              <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                                <TrendingUp className="w-5 h-5 text-emerald-400 mr-2" />
                                Growth Path
                              </h4>
                              <p className="text-gray-300">{job.growthPath}</p>
                            </div>
                          )}

                          {/* Perks */}
                          <div>
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                              <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
                              Perks & Benefits
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-900/50 to-black/50 rounded-xl border border-amber-800/30">
                                <Coffee className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-100 text-sm">
                                  Flexible Hours
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-900/50 to-black/50 rounded-xl border border-amber-800/30">
                                <Award className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-100 text-sm">
                                  Learning Budget
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-900/50 to-black/50 rounded-xl border border-amber-800/30">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span className="text-red-100 text-sm">
                                  Health Benefits
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-900/50 to-black/50 rounded-xl border border-amber-800/30">
                                <Globe className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-100 text-sm">
                                  Remote Work
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-amber-900/20 via-emerald-900/20 to-blue-900/20 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 md:p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Don't See Your Perfect Role?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8">
              Nile Flow is constantly evolving, and we value unique
              perspectives. If you're passionate about African e-commerce and
              have skills to contribute, pitch us your dream role.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:careers@nileflowafrica.com?subject=Open%20Application"
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Pitch Your Role</span>
              </a>
              <a
                href="mailto:careers@nileflowafrica.com?subject=General%20Inquiry"
                className="px-8 py-3 border-2 border-amber-500/50 text-amber-400 font-bold rounded-xl hover:bg-amber-500/10 transition-all duration-300"
              >
                General Inquiry
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Careers;
