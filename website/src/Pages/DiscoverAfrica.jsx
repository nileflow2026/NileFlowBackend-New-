/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Globe,
  Mountain,
  Users,
  Heart,
  BookOpen,
  MapPin,
  Camera,
  Music,
  Award,
  ChevronRight,
  Quote,
  Star,
  Trophy,
  Shield,
  Sunrise,
  Zap,
  Leaf,
  Coffee,
  Diamond,
  Compass,
  ShoppingBag,
  Loader2,
  Play,
  Pause,
  Volume2,
  SkipForward,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  fetchAfricanFacts,
  fetchAfricanProverbs,
  fetchAfricanStats,
} from "../../utils/discoverAfricaService";

const DiscoverAfrica = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [africanFacts, setAfricanFacts] = useState([]);
  const [africanProverbs, setAfricanProverbs] = useState([]);
  const [stats, setStats] = useState({
    countries: 54,
    languages: 2000,
    ethnicGroups: 3000,
    naturalWonders: 7,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  // Icon mapping for dynamic icons
  const iconMap = {
    Compass: <Compass className="w-6 h-6" />,
    Shield: <Shield className="w-6 h-6" />,
    Mountain: <Mountain className="w-6 h-6" />,
    Award: <Award className="w-6 h-6" />,
    Trophy: <Trophy className="w-6 h-6" />,
    Sparkles: <Sparkles className="w-6 h-6" />,
    Coffee: <Coffee className="w-6 h-6" />,
    Leaf: <Leaf className="w-6 h-6" />,
    Globe: <Globe className="w-6 h-6" />,
    Users: <Users className="w-6 h-6" />,
    BookOpen: <BookOpen className="w-6 h-6" />,
    Camera: <Camera className="w-6 h-6" />,
  };

  const categories = [
    { id: "all", name: "All Wonders", icon: <Globe className="w-5 h-5" /> },
    {
      id: "culture",
      name: "Cultural Heritage",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "nature",
      name: "Natural Wonders",
      icon: <Mountain className="w-5 h-5" />,
    },
    {
      id: "history",
      name: "Historical Facts",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: "art",
      name: "Art & Creativity",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: "wildlife",
      name: "Wildlife & Safari",
      icon: <Camera className="w-5 h-5" />,
    },
  ];

  // Fallback data in case API fails
  const fallbackFacts = [
    {
      $id: "1",
      category: "nature",
      title: "The Great Migration",
      description:
        "Witness the largest mammal migration on Earth where over 1.5 million wildebeest, zebras, and gazelles travel between Serengeti and Masai Mara in search of fresh grazing.",
      image:
        "https://images.unsplash.com/photo-1550358864-518f202c02ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      location: "Serengeti & Masai Mara",
      iconName: "Compass",
      gradient: "from-emerald-500 to-green-700",
      tags: ["Migration", "Wildlife", "Nature"],
      duration: "July - October",
    },
    {
      $id: "2",
      category: "culture",
      title: "The Maasai Warriors",
      description:
        "The Maasai people of Kenya and Tanzania are renowned for their distinctive customs, vibrant red clothing (shuka), and warrior traditions that have been preserved for centuries.",
      image:
        "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      location: "Kenya & Tanzania",
      iconName: "Shield",
      gradient: "from-red-500 to-amber-700",
      tags: ["Culture", "Tradition", "Heritage"],
      population: "2 Million+",
    },
  ];

  const fallbackProverbs = [
    "It takes a village to raise a child.",
    "A spider's web is stronger than it looks.",
    "Do not look where you fell, but where you slipped.",
    "He who learns, teaches.",
    "Smooth seas do not make skillful sailors.",
    "A tree is known by its fruit.",
    "When there is no enemy within, the enemies outside cannot hurt you.",
  ];

  // African Music Collection
  const africanMusicTracks = [
    {
      id: 1,
      title: "Djembe Rhythms",
      artist: "West African Ensemble",
      region: "West Africa",
      genre: "Traditional Drumming",
      duration: "3:45",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Replace with actual African music
      color: "from-purple-500 to-pink-500",
      description: "Traditional djembe drum patterns from Mali and Guinea",
    },
    {
      id: 2,
      title: "Afrobeat Fusion",
      artist: "Lagos Collective",
      region: "Nigeria",
      genre: "Afrobeat",
      duration: "4:20",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", // Replace with actual African music
      color: "from-pink-500 to-red-500",
      description: "Modern Afrobeat with traditional Nigerian influences",
    },
    {
      id: 3,
      title: "Maasai Chants",
      artist: "Maasai Warriors",
      region: "Kenya & Tanzania",
      genre: "Traditional Vocals",
      duration: "5:10",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", // Replace with actual African music
      color: "from-red-500 to-orange-500",
      description: "Ancient warrior chants and ceremonial songs",
    },
    {
      id: 4,
      title: "Mbira Dreams",
      artist: "Shona Musicians",
      region: "Zimbabwe",
      genre: "Mbira Music",
      duration: "6:30",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", // Replace with actual African music
      color: "from-orange-500 to-yellow-500",
      description: "Hypnotic thumb piano melodies from Zimbabwe",
    },
    {
      id: 5,
      title: "Soukous Dance",
      artist: "Congo Stars",
      region: "Congo",
      genre: "Soukous",
      duration: "4:50",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", // Replace with actual African music
      color: "from-yellow-500 to-green-500",
      description: "Energetic Congolese dance music with guitar riffs",
    },
  ];

  // Music Player Functions
  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      audioRef?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef) {
        audioRef.pause();
      }
      const audio = new Audio(track.audioUrl);
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTrack(null);
      });
      audio.play();
      setAudioRef(audio);
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = "";
      }
    };
  }, [audioRef]);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [factsData, proverbsData, statsData] = await Promise.all([
          fetchAfricanFacts({ category: activeCategory }),
          fetchAfricanProverbs(7),
          fetchAfricanStats(),
        ]);

        setAfricanFacts(factsData);
        setAfricanProverbs(proverbsData);
        setStats(statsData);
      } catch (err) {
        console.error("Error loading Discover Africa data:", err);
        setError("Failed to load content. Using default data.");

        // Set fallback data on error
        setAfricanFacts(fallbackFacts);
        setAfricanProverbs(fallbackProverbs);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const filteredFacts =
    activeCategory === "all"
      ? africanFacts
      : africanFacts.filter((fact) => fact.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-emerald-900/20 to-blue-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Cultural Discovery
            </span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-emerald-200 to-blue-200 bg-clip-text text-transparent">
              Did You Know?
            </span>
            <br />
            <span className="text-white">Africa's Hidden Treasures</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-10">
            Discover the incredible diversity, rich heritage, and breathtaking
            wonders of Africa. From ancient civilizations to natural marvels,
            explore the continent that inspires Nile Flow's premium products.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">54</div>
              <div className="text-amber-100/80 text-sm">Countries</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">2000+</div>
              <div className="text-emerald-100/80 text-sm">Languages</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">3000</div>
              <div className="text-blue-100/80 text-sm">Ethnic Groups</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-purple-300">7</div>
              <div className="text-purple-100/80 text-sm">Natural Wonders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* African Proverbs Banner */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-amber-900/20 via-emerald-900/20 to-blue-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center">
                    <Quote className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    African Wisdom
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {africanProverbs.map((proverb, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Star className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-300 italic">"{proverb}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`group relative px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 ${
                      activeCategory === category.id
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                        : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                    }`}
                  >
                    {activeCategory === category.id && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-30"></div>
                    )}
                    <span className="relative">{category.icon}</span>
                    <span className="relative font-medium">
                      {category.name}
                    </span>
                    {activeCategory === category.id && (
                      <Zap className="relative w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-4">
              <div className="text-amber-200">
                Showing{" "}
                <span className="text-amber-300 font-bold">
                  {filteredFacts.length}
                </span>{" "}
                African wonders
              </div>
            </div>
          </div>

          {/* Facts Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredFacts.map((fact) => (
                <div
                  key={fact.$id}
                  className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
                >
                  {/* Background Glow */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${fact.gradient}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Fact Card */}
                  <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-2xl group-hover:shadow-amber-900/30 h-full">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                      <img
                        src={fact.image}
                        alt={fact.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 z-20">
                        <div
                          className={`bg-gradient-to-r ${fact.gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1`}
                        >
                          <span>
                            {iconMap[fact.iconName] || (
                              <Globe className="w-6 h-6" />
                            )}
                          </span>
                          <span>{fact.tags?.[0] || "Featured"}</span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="absolute bottom-4 left-4 z-20">
                        <div className="flex items-center space-x-1 text-white">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {fact.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
                        {fact.title}
                      </h3>

                      <p className="text-gray-300 mb-4 line-clamp-3">
                        {fact.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {fact.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-lg text-amber-100 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Fact Detail */}
                      <div className="flex items-center justify-between pt-4 border-t border-amber-800/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-amber-700/30 flex items-center justify-center">
                            {iconMap[fact.iconName] || (
                              <Globe className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-amber-100/70">
                              Did You Know?
                            </div>
                            <div className="text-sm font-bold text-amber-300">
                              {fact.duration ||
                                fact.population ||
                                fact.height ||
                                fact.count ||
                                fact.tradition ||
                                fact.origin ||
                                fact.size ||
                                fact.animals ||
                                "Learn More"}
                            </div>
                          </div>
                        </div>

                        <button className="p-2 border-2 border-amber-500/50 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all duration-300">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Hover Effect Line */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredFacts.length === 0 && (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                <Globe className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                No Facts Found
              </h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                No African facts available in this category yet. Check back
                soon!
              </p>
              <button
                onClick={() => setActiveCategory("all")}
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
              >
                <Globe className="w-5 h-5" />
                <span>View All Facts</span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-amber-200">
                Loading African Wonders
              </h3>
              <p className="text-gray-400 mt-2">
                Discovering cultural treasures...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{error}</h3>
                  <p className="text-red-200 text-sm">Showing cached content</p>
                </div>
              </div>
            </div>
          )}

          {/* African Music & Dance Section */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-800/30 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Rhythms of Africa
                    </h3>
                    <p className="text-purple-200 text-sm">
                      Listen to authentic African music
                    </p>
                  </div>
                </div>
                <Volume2 className="w-6 h-6 text-purple-400" />
              </div>

              <p className="text-gray-300 mb-6">
                Africa's musical heritage is as diverse as its landscapes. From
                the djembe drums of West Africa to the mbira of Zimbabwe, music
                is woven into the fabric of daily life, ceremonies, and
                celebrations.
              </p>

              {/* Music Player */}
              <div className="space-y-3">
                {africanMusicTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`group relative bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] ${
                      currentTrack?.id === track.id
                        ? "border-purple-500 shadow-lg shadow-purple-900/30"
                        : "border-purple-800/30 hover:border-purple-500/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Play Button */}
                      <button
                        onClick={() => handlePlayTrack(track)}
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          currentTrack?.id === track.id && isPlaying
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-900/50"
                            : "bg-gradient-to-r from-purple-900/50 to-pink-900/50 hover:from-purple-600 hover:to-pink-600"
                        }`}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-bold truncate">
                            {track.title}
                          </h4>
                          <span className="text-purple-300 text-sm ml-2">
                            {track.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">{track.artist}</span>
                          <span className="text-purple-400">•</span>
                          <span className="text-purple-300">
                            {track.region}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1 truncate">
                          {track.description}
                        </p>
                      </div>

                      {/* Genre Badge */}
                      <div
                        className={`hidden md:block flex-shrink-0 px-3 py-1.5 bg-gradient-to-r ${track.color} rounded-lg text-white text-xs font-bold`}
                      >
                        {track.genre}
                      </div>

                      {/* Playing Indicator */}
                      {currentTrack?.id === track.id && isPlaying && (
                        <div className="flex-shrink-0 flex items-center space-x-1">
                          <div
                            className="w-1 h-3 bg-purple-500 rounded-full animate-pulse"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-1 h-4 bg-pink-500 rounded-full animate-pulse"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-1 h-3 bg-purple-500 rounded-full animate-pulse"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar (shown when playing) */}
                    {currentTrack?.id === track.id && isPlaying && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-900/30 rounded-b-xl overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Music Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-purple-800/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <span className="text-purple-200 text-sm">
                    Djembe Drumming
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-red-500"></div>
                  <span className="text-pink-200 text-sm">Soukous Dance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
                  <span className="text-red-200 text-sm">Afrobeat</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500"></div>
                  <span className="text-orange-200 text-sm">Maasai Chants</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Heart className="w-8 h-8 text-red-400" />
                <h3 className="text-2xl font-bold text-white">
                  Experience African Culture
                </h3>
                <Diamond className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                At Nile Flow, we celebrate Africa's rich heritage through our
                premium products. Each item tells a story of craftsmanship,
                tradition, and cultural significance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/shop"
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Shop African Products</span>
                </Link>
                <Link
                  to="/categories"
                  className="px-8 py-3 border-2 border-amber-500/50 text-amber-400 font-bold rounded-xl hover:bg-amber-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Compass className="w-5 h-5" />
                  <span>Explore Collections</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DiscoverAfrica;
