/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Map,
  Globe,
  Users,
  Mountain,
  Camera,
  Music,
  Coffee,
  Heart,
  Star,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  Bookmark,
  Share2,
  Clock,
  Compass,
  Sparkles,
  Quote,
  Award,
  Shield,
  Sunrise,
  Moon,
  Wind,
  Droplets,
  Palette,
  Drum,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const AfricanChronicles = () => {
  const [activeStory, setActiveStory] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [volume, setVolume] = useState(70);
  const [activeChapter, setActiveChapter] = useState(0);

  const stories = [
    {
      id: 1,
      title: "The Whispering Winds of the Sahara",
      subtitle: "A Journey Through Time and Sand",
      country: "Morocco/Algeria",
      duration: "12 min read",
      category: "Geography",
      coverImage:
        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      gradient: "from-amber-700 to-orange-800",
      icon: <Wind className="w-8 h-8" />,
      mood: "Epic & Mysterious",
      author: "Fatima Alami",
      tags: ["Desert", "Nomads", "Caravans", "History"],
      audioDuration: "12:45",
      chapters: [
        {
          title: "The Caravan Routes",
          content:
            "For centuries, the Sahara was not a barrier but a bridge. Vast caravans of camels, sometimes numbering in the thousands, crossed the golden dunes carrying salt from the north to trade for gold from the great empires of West Africa. The Tuareg people, 'the Blue Men of the Desert,' navigated this sea of sand using stars and ancestral knowledge passed down through generations.",
          image:
            "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "The Salt Cities",
          content:
            "In the heart of the desert rose cities carved from the earth itself. Timbuktu, once the richest city on Earth, became a center of learning with libraries containing thousands of manuscripts. The salt mines of Taoudenni, where prisoners and slaves once worked in unimaginable conditions, produced the 'white gold' that powered empires.",
          image:
            "https://images.unsplash.com/photo-1544552866-d3ed42536d8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "Whispers in the Dunes",
          content:
            "The Sahara holds secrets older than humanity itself. Cave paintings in Tassili n'Ajjer depict a time when the desert was green, with giraffes, elephants, and rivers flowing through what is now barren rock. These ancient galleries tell stories of climate change on a continental scale, reminding us that nothing is permanent, not even deserts.",
          image:
            "https://images.unsplash.com/photo-1580502304785-50d01b0a7b78?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
      ],
      didYouKnow: [
        "The Sahara is expanding southward at about 48km per year",
        "Some desert sand dunes 'sing' with low-frequency vibrations",
        "The world's largest fossil water aquifer lies beneath the Sahara",
      ],
    },
    {
      id: 2,
      title: "The Heartbeat of the Congo Basin",
      subtitle: "Where the Forest Breathes",
      country: "DR Congo",
      duration: "15 min read",
      category: "Nature",
      coverImage:
        "https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      gradient: "from-emerald-700 to-green-900",
      icon: <Droplets className="w-8 h-8" />,
      mood: "Mystical & Alive",
      author: "Joseph Mbongo",
      tags: ["Rainforest", "Biodiversity", "Rivers", "Conservation"],
      audioDuration: "15:30",
      chapters: [
        {
          title: "The Second Lung of the Earth",
          content:
            "Deep in the heart of Africa lies the Congo Basin, the world's second-largest rainforest. Here, trees grow so tall they create their own weather. Morning mist rises from the forest floor like the breath of a sleeping giant. The air is thick with moisture and life - the scent of blooming orchids, decaying leaves, and damp earth.",
          image:
            "https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "River of Stories",
          content:
            "The Congo River, deep and powerful enough to swallow the Mississippi, flows like a pulsing artery through the forest. Its waters carry legends of river spirits and ancient kingdoms. Along its banks, fishermen tell stories of Mami Wata, the water spirit who protects those who respect her domain.",
          image:
            "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "The Forest's Symphony",
          content:
            "As dawn breaks, the forest awakens with a symphony unmatched anywhere on Earth. Lowland gorillas beat their chests, chimpanzees call to each other through the canopy, and thousands of bird species create a chorus so complex it sounds like the forest itself is singing. This is nature's oldest orchestra, playing a composition millions of years in the making.",
          image:
            "https://images.unsplash.com/photo-1550358864-518f202c02ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
      ],
      didYouKnow: [
        "The Congo Basin stores 8% of the world's forest carbon",
        "It's home to over 10,000 species of tropical plants",
        "The forest produces its own rainfall through transpiration",
      ],
    },
    {
      id: 3,
      title: "The Rhythm of Lagos Nights",
      subtitle: "Africa's Electric City",
      country: "Nigeria",
      duration: "10 min read",
      category: "Culture",
      coverImage:
        "https://images.unsplash.com/photo-1528164344705-47542687000d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      gradient: "from-purple-700 to-pink-800",
      icon: <Music className="w-8 h-8" />,
      mood: "Vibrant & Electric",
      author: "Chinedu Okoro",
      tags: ["City Life", "Music", "Innovation", "Nollywood"],
      audioDuration: "10:15",
      chapters: [
        {
          title: "The City That Never Sleeps",
          content:
            "Lagos moves to a rhythm all its own. From the honking of danfo buses at dawn to the pulsing Afrobeat clubs at midnight, the city breathes music. On the streets of Yaba, tech startups bloom beside roadside markets where traders sell everything from fresh coconuts to smartphone chargers.",
          image:
            "https://images.unsplash.com/photo-1520105072000-f44fc083e648?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "Afrobeat's Birthplace",
          content:
            "In the 1970s, Fela Kuti's Kalakuta Republic became the crucible where traditional Yoruba music met jazz, funk, and political rebellion. Today, his spirit lives in the music of Burna Boy and Wizkid, who carry African rhythms to global stages. The sound of Lagos is the sound of resistance turned to celebration.",
          image:
            "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "Nollywood Dreams",
          content:
            "In the suburb of Surulere, magic happens every day. With budgets smaller than Hollywood craft services, Nigerian filmmakers produce more movies than any industry except India's Bollywood. These stories—of love, betrayal, family, and faith—connect with millions across Africa and the diaspora.",
          image:
            "https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
      ],
      didYouKnow: [
        "Lagos is building Africa's first floating city",
        "Nollywood produces about 2,500 films yearly",
        "Afrobeats is now the fastest-growing music genre globally",
      ],
    },
  ];

  const storyCategories = [
    {
      id: "all",
      name: "All Stories",
      icon: <BookOpen className="w-5 h-5" />,
      count: 12,
    },
    {
      id: "geography",
      name: "Landscapes",
      icon: <Mountain className="w-5 h-5" />,
      count: 4,
    },
    {
      id: "culture",
      name: "Traditions",
      icon: <Users className="w-5 h-5" />,
      count: 5,
    },
    {
      id: "history",
      name: "Legends",
      icon: <Award className="w-5 h-5" />,
      count: 3,
    },
    {
      id: "wildlife",
      name: "Wildlife",
      icon: <Camera className="w-5 h-5" />,
      count: 4,
    },
    {
      id: "cities",
      name: "Urban Tales",
      icon: <Globe className="w-5 h-5" />,
      count: 4,
    },
  ];

  const currentStory = stories[activeStory];

  const nextStory = () => {
    setActiveStory((prev) => (prev + 1) % stories.length);
    setActiveChapter(0);
  };

  const prevStory = () => {
    setActiveStory((prev) => (prev - 1 + stories.length) % stories.length);
    setActiveChapter(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-purple-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-purple-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200 font-medium tracking-wide">
                African Chronicles
              </span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                Stories That
              </span>
              <br />
              <span className="text-white">Breathe Africa</span>
            </h1>

            <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-10">
              Immerse yourself in the soul of Africa through captivating
              narratives that blend history, culture, and natural wonders. Each
              story is a journey waiting to be told.
            </p>
          </div>

          {/* Main Story Display */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden mb-12">
            <div className="relative h-96">
              {/* Story Cover Image */}
              <div className="absolute inset-0">
                <img
                  src={currentStory.coverImage}
                  alt={currentStory.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              </div>

              {/* Story Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${currentStory.gradient} flex items-center justify-center`}
                    >
                      {currentStory.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm rounded-full border border-amber-700/30 text-amber-200 text-sm">
                          {currentStory.category}
                        </span>
                        <span className="text-gray-300 flex items-center space-x-1">
                          <Map className="w-4 h-4" />
                          <span>{currentStory.country}</span>
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">
                        {currentStory.title}
                      </h2>
                      <p className="text-gray-300">{currentStory.subtitle}</p>
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center space-x-4">
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        isBookmarked
                          ? "bg-gradient-to-r from-amber-600 to-amber-700 border-amber-500 text-white"
                          : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-amber-400 hover:border-amber-500/50"
                      }`}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          isBookmarked ? "fill-current" : ""
                        }`}
                      />
                    </button>
                    <button className="p-3 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 text-amber-400 hover:border-amber-500/50 transition-all duration-300">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Story Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={prevStory}
                      className="p-3 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 text-amber-400 hover:border-amber-500/50 transition-all duration-300"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                      <div className="text-white font-bold">
                        {activeStory + 1} / {stories.length}
                      </div>
                      <div className="text-amber-200/70 text-sm">Stories</div>
                    </div>

                    <button
                      onClick={nextStory}
                      className="p-3 rounded-xl bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 text-amber-400 hover:border-amber-500/50 transition-all duration-300"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden md:block">
                      <div className="text-amber-200">Written by</div>
                      <div className="text-white font-bold">
                        {currentStory.author}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center space-x-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5" />
                          <span>Pause Story</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          <span>Listen to Story</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Player */}
            <div className="border-t border-amber-800/30 p-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-amber-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-24 accent-amber-500"
                  />
                  <span className="text-amber-200 text-sm w-10">{volume}%</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-amber-200/70 mb-1">
                    <span>0:00</span>
                    <span>{currentStory.audioDuration}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${volume}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm rounded-full border border-amber-700/30 text-amber-200 text-sm">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {currentStory.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Categories */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Explore by Theme
              </h3>
              <Link
                to="/stories/all"
                className="text-amber-400 hover:text-amber-300 transition-colors flex items-center space-x-1"
              >
                <span>View All Stories</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {storyCategories.map((category) => (
                <button
                  key={category.id}
                  className="group relative p-4 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl hover:border-amber-500/50 transition-all duration-300 text-center"
                >
                  <div className="mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-900/30 to-purple-900/30 border border-amber-700/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <span className="text-amber-400">{category.icon}</span>
                    </div>
                  </div>
                  <div className="text-white font-medium mb-1">
                    {category.name}
                  </div>
                  <div className="text-amber-200/70 text-sm">
                    {category.count} stories
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Story Chapters */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">
              Journey Through the Story
            </h3>

            <div className="space-y-8">
              {currentStory.chapters.map((chapter, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1 ${
                    activeChapter === index ? "ring-2 ring-amber-500/50" : ""
                  }`}
                  onClick={() => setActiveChapter(index)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${currentStory.gradient
                      .replace("700", "500")
                      .replace(
                        "800",
                        "600"
                      )}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 relative h-64 md:h-auto">
                        <img
                          src={chapter.image}
                          alt={chapter.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent md:bg-gradient-to-t md:from-black/90 md:via-black/50 md:to-transparent"></div>
                        <div className="absolute top-4 left-4 z-10">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                        </div>
                      </div>

                      <div className="md:w-2/3 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-white mb-2">
                              {chapter.title}
                            </h4>
                            <div className="flex items-center space-x-3">
                              <span className="text-amber-200 text-sm flex items-center">
                                <Compass className="w-4 h-4 mr-1" />
                                Chapter {index + 1}
                              </span>
                            </div>
                          </div>

                          {activeChapter === index && (
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-purple-500 animate-pulse"></div>
                          )}
                        </div>

                        <p className="text-gray-300 leading-relaxed mb-4">
                          {chapter.content}
                        </p>

                        <div className="flex items-center space-x-4">
                          <button className="text-amber-400 hover:text-amber-300 transition-colors text-sm flex items-center space-x-1">
                            <Play className="w-4 h-4" />
                            <span>Listen to this chapter</span>
                          </button>
                          <button className="text-purple-400 hover:text-purple-300 transition-colors text-sm flex items-center space-x-1">
                            <Bookmark className="w-4 h-4" />
                            <span>Save excerpt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Did You Know? Sidebar */}
          <div className="lg:grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    About the Storyteller
                  </h3>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 rounded-full border-2 border-amber-500 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                      alt="Storyteller"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">
                      {currentStory.author}
                    </h4>
                    <p className="text-gray-300 mb-4">
                      An award-winning storyteller specializing in African
                      narratives.
                      {currentStory.author} has traveled across the continent
                      documenting stories that blend history, culture, and
                      personal journeys.
                    </p>
                    <div className="flex items-center space-x-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-emerald-900/40 to-green-900/30 backdrop-blur-sm rounded-full border border-emerald-700/30 text-emerald-200 text-sm">
                        📚 24 Stories
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-900/40 to-indigo-900/30 backdrop-blur-sm rounded-full border border-blue-700/30 text-blue-200 text-sm">
                        🎙️ Audio Producer
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-800/30 rounded-2xl p-6 h-full">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Quote className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Did You Know?
                  </h3>
                </div>

                <div className="space-y-4">
                  {currentStory.didYouKnow.map((fact, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-gray-300">{fact}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-purple-800/30">
                  <div className="text-center">
                    <div className="text-amber-300 text-sm mb-1">
                      Story Mood
                    </div>
                    <div className="text-white font-bold text-lg">
                      {currentStory.mood}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other Stories */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              More African Stories
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories
                .filter((s) => s.id !== currentStory.id)
                .map((story) => (
                  <div
                    key={story.id}
                    className="group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${story.gradient
                        .replace("700", "500")
                        .replace(
                          "800",
                          "600"
                        )}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    ></div>

                    <div className="relative bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-amber-800/30 rounded-3xl overflow-hidden h-full">
                      {/* Story Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={story.coverImage}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

                        {/* Quick Info */}
                        <div className="absolute top-4 left-4 z-10">
                          <div
                            className={`px-3 py-1.5 bg-gradient-to-r ${story.gradient} text-white text-xs font-bold rounded-full shadow-lg`}
                          >
                            {story.category}
                          </div>
                        </div>
                      </div>

                      {/* Story Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors duration-300 mb-2">
                              {story.title}
                            </h4>
                            <p className="text-gray-400 text-sm mb-3">
                              {story.subtitle}
                            </p>
                          </div>
                          <div className="text-amber-400">{story.icon}</div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Map className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-200 text-sm">
                              {story.country}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-amber-200/70">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{story.duration}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {story.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-lg text-amber-100 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            setActiveStory(
                              stories.findIndex((s) => s.id === story.id)
                            )
                          }
                          className="w-full py-3 bg-gradient-to-r from-gray-900/50 to-black/50 border border-amber-800/30 text-amber-400 rounded-xl hover:border-amber-500/50 hover:text-amber-300 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Read This Story</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AfricanChronicles;
