/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Zap,
  Sparkles,
} from "lucide-react";
import axiosClient from "../api";

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [touchStartX, setTouchStartX] = useState(null);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        const res = await axiosClient.get("/api/customerprofile/hero-products");
        const data = res.data;
        const combined = [...data.featured, ...data.deals];
        setSlides(combined);
      } catch (error) {
        console.error("Error fetching hero products:", error);
      }
    };

    fetchHeroProducts();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [slides, current]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center mt-6 rounded-3xl overflow-hidden bg-gradient-to-br from-amber-900/10 via-gray-900/10 to-emerald-900/10 backdrop-blur-sm">
        <div className="relative flex flex-col items-center z-10">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-amber-500 animate-pulse" />
            </div>
          </div>
          <h3 className="mt-6 text-2xl font-bold bg-gradient-to-r from-amber-300 to-emerald-200 bg-clip-text text-transparent">
            Curating Premium African Products
          </h3>
          <p className="mt-2 text-amber-100/70">Loading exclusive deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl shadow-2xl mt-6 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20 z-0"></div>

      {/* Slides */}
      <div
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((item, index) => (
          <div
            key={item.$id}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              index === current
                ? "opacity-100 translate-x-0"
                : index < current
                ? "-translate-x-full opacity-0"
                : "translate-x-full opacity-0"
            }`}
          >
            {/* Background Image with Gradient Overlay */}
            <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900">
              <img
                src={item.image || "/placeholder.jpg"}
                alt={item.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-20">
              <div className="max-w-2xl space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/50 to-amber-700/30 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-700/50 w-fit">
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span className="text-amber-200 text-sm font-medium">
                    {item.category || "Exclusive Deal"}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white drop-shadow-2xl">
                  <span className="bg-gradient-to-r from-amber-300 via-emerald-200 to-yellow-200 bg-clip-text text-transparent">
                    {item.title}
                  </span>
                </h2>

                {/* Description */}
                <p className="text-sm sm:text-base md:text-lg xl:text-xl text-gray-200 max-w-xl leading-relaxed">
                  {item.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-100 text-sm">
                      Premium Quality
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-100 text-sm">
                      Authentic Origin
                    </span>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                  {item.price && (
                    <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-amber-100/70 text-sm">From</span>
                        <span className="text-3xl font-bold text-amber-300">
                          {item.price}
                        </span>
                        {item.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href={`/products/${item.productId}`}
                      className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2"
                    >
                      <span>Shop Now</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition-opacity duration-300"></div>
                    </a>
                    <a
                      href={`/shop`}
                      className="px-8 py-4 border-2 border-amber-500/50 text-amber-100 font-bold rounded-2xl hover:bg-amber-500/10 transition-all duration-300 backdrop-blur-sm"
                    >
                      Explore All
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:from-gray-900 hover:to-black transition-all duration-300 opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 hover:scale-110 border border-amber-700/30 shadow-2xl"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:from-gray-900 hover:to-black transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 hover:scale-110 border border-amber-700/30 shadow-2xl"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-1 bg-gray-800/50 backdrop-blur-sm rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${((current + 1) / slides.length) * 100}%`,
          }}
        />
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 right-8 flex items-center space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrent(i);
                setTimeout(() => setIsTransitioning(false), 700);
              }
            }}
            className="relative group"
            aria-label={`Go to slide ${i + 1}`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-gradient-to-r from-amber-500 to-emerald-500 scale-125"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            />
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-6 left-8 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-amber-700/30">
        <span className="text-amber-200 font-bold">
          <span className="text-amber-300 text-xl">{current + 1}</span>
          <span className="text-amber-100/60 mx-2">/</span>
          <span className="text-amber-100">{slides.length}</span>
        </span>
      </div>
    </div>
  );
};

export default HeroCarousel;
