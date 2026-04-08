import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Heart,
  Star,
  MapPin,
  Users,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  Palette,
  TrendingUp,
  Coffee,
  Music,
  Compass,
  Shield,
  Truck,
  Gem,
  Camera,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import ArtisanStories from "../components/ArtisanStories";
import axiosClient from "../api";

const ArtisanProfile = () => {
  const { artisanId } = useParams();
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    const fetchArtisanProfile = async () => {
      setLoading(true);
      try {
        const [artisanRes, productsRes] = await Promise.all([
          axiosClient.get(`/api/artisans/${artisanId}`),
          axiosClient.get(`/api/artisans/${artisanId}/products`),
        ]);

        setArtisan(artisanRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.error("Error fetching artisan profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtisanProfile();
  }, [artisanId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-8xl mx-auto flex justify-center">
            <div className="w-16 h-16 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-emerald-900/20 to-blue-900/20"></div>

        <div className="relative max-w-8xl mx-auto">
          {/* Artisan Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 mb-12">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-30"></div>
              <img
                src={artisan.photo}
                alt={artisan.name}
                className="relative w-32 h-32 rounded-full border-4 border-gray-900 object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {artisan.name}
                </h1>
                {artisan.isVerified && (
                  <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1 rounded-full text-sm">
                    <Award className="w-4 h-4" />
                    <span>Verified Artisan</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-200">
                    {artisan.village}, {artisan.country}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-yellow-200">
                    {artisan.rating} ({artisan.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-200">
                    {artisan.followers} followers
                  </span>
                </div>
              </div>

              <p className="text-gray-300 max-w-3xl">{artisan.bio}</p>
            </div>

            <div className="flex items-center space-x-3">
              <button className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300">
                Follow
              </button>
              <button className="px-6 py-3 border-2 border-amber-500/50 text-amber-300 font-bold rounded-xl hover:bg-amber-500/10 transition-all duration-300">
                Contact
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-300 mb-2">
                {products.length}
              </div>
              <div className="text-amber-100/80">Products</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-300 mb-2">
                {artisan.yearsCrafting}
              </div>
              <div className="text-emerald-100/80">Years Crafting</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-300 mb-2">
                {artisan.familySupported}
              </div>
              <div className="text-blue-100/80">Family Supported</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-red-300 mb-2">
                {artisan.communityProjects}
              </div>
              <div className="text-red-100/80">Community Projects</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Navigation */}
          <div className="flex overflow-x-auto space-x-1 mb-8 pb-2">
            {["about", "collection", "process", "impact", "gallery"].map(
              (section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-6 py-3 rounded-xl whitespace-nowrap transition-all duration-300 ${
                    activeSection === section
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg"
                      : "bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 text-gray-300 hover:text-white"
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ),
            )}
          </div>

          {/* About Section */}
          {activeSection === "about" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Story */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      Their Story
                    </h2>
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {artisan.story}
                    </p>

                    <div className="grid grid-cols-2 gap-6 mt-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-700/30 flex items-center justify-center">
                          <Palette className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-amber-100 text-sm">Craft</div>
                          <div className="text-white font-bold">
                            {artisan.craftType}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-700/30 flex items-center justify-center">
                          <Coffee className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-emerald-100 text-sm">
                            Ethnic Group
                          </div>
                          <div className="text-white font-bold">
                            {artisan.ethnicGroup}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cultural Heritage */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-blue-400" />
                      Cultural Heritage
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-100">Language</span>
                        <span className="text-blue-300 font-medium">
                          {artisan.language}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-100">Generation</span>
                        <span className="text-blue-300 font-medium">
                          {artisan.generation}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-100">Traditions</span>
                        <span className="text-blue-300 font-medium">
                          {artisan.traditions}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Workshop Info */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-800/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Workshop
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-100">Location</span>
                        <span className="text-purple-300 font-medium">
                          {artisan.workshopLocation}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-100">Team Size</span>
                        <span className="text-purple-300 font-medium">
                          {artisan.teamSize} artisans
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-100">Established</span>
                        <span className="text-purple-300 font-medium">
                          {artisan.establishedYear}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills & Techniques */}
              <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Skills & Techniques
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {artisan.skills?.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border border-amber-700/30 rounded-xl p-4 text-center"
                    >
                      <div className="text-amber-300 font-bold mb-2">
                        {skill.name}
                      </div>
                      <div className="text-amber-100 text-sm">
                        {skill.years} years
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collection Section */}
          {activeSection === "collection" && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Artisan's Collection
                </h2>
                <p className="text-gray-400">
                  Handcrafted products made with traditional techniques and
                  modern design.
                </p>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.$id}
                      product={product}
                      id={product.$id}
                      premium={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-12 h-12 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    No Products Available
                  </h3>
                  <p className="text-gray-400">
                    New products from this artisan are coming soon.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Impact Section */}
          {activeSection === "impact" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-800/30 rounded-2xl p-8">
                  <div className="text-5xl font-bold text-emerald-300 mb-4">
                    {artisan.totalEarned?.toLocaleString()}
                  </div>
                  <div className="text-emerald-100 text-lg mb-2">
                    Total Earned
                  </div>
                  <p className="text-emerald-100/70 text-sm">
                    Through Nile Flow since {artisan.joinedYear}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-800/30 rounded-2xl p-8">
                  <div className="text-5xl font-bold text-blue-300 mb-4">
                    {artisan.apprenticesTrained}
                  </div>
                  <div className="text-blue-100 text-lg mb-2">
                    Apprentices Trained
                  </div>
                  <p className="text-blue-100/70 text-sm">
                    Passing traditional skills to the next generation
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border border-amber-800/30 rounded-2xl p-8">
                  <div className="text-5xl font-bold text-amber-300 mb-4">
                    {artisan.communityProjects}
                  </div>
                  <div className="text-amber-100 text-lg mb-2">
                    Community Projects
                  </div>
                  <p className="text-amber-100/70 text-sm">
                    Funded through artisan earnings
                  </p>
                </div>
              </div>

              {/* Impact Stories */}
              <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Impact Stories
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {artisan.impactStories?.map((story, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-900/30 to-black/30 border border-amber-700/30 rounded-xl p-6"
                    >
                      <div className="text-amber-300 font-bold mb-2">
                        {story.title}
                      </div>
                      <p className="text-gray-300 mb-4">{story.description}</p>
                      <div className="text-amber-100/70 text-sm">
                        {story.year}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArtisanProfile;
