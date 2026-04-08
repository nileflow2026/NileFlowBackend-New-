/* eslint-disable no-unused-vars */
import React, { useState, Suspense, lazy } from "react";
import Header from "../../components/Header";
import Categories from "../../components/Categories";
import Footer from "../../components/Footer";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";
import useStructuredData from "../hooks/useStructuredData";
import { ORGANIZATION_SCHEMA } from "../constants/structuredData";

// Lazy load non-critical components
const HeroCarousel = lazy(() => import("../../components/HeroCarousel "));
const FeaturedProducts = lazy(
  () => import("../../components/FeaturedProducts"),
);
const RecommendationSection = lazy(() =>
  import("../../components/RecommendationSection").then((module) => ({
    default: module.RecommendationSection,
  })),
);
const PremiumBanner = lazy(() => import("../../components/PremiumBanner"));
const ScrollToTopButton = lazy(
  () => import("../../components/ScrollToTopButton"),
);

// Skeleton components for better perceived performance
const HeroSkeleton = () => (
  <div className="w-full h-64 md:h-96 bg-gray-800 rounded-lg animate-pulse"></div>
);

const ProductsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-gray-800 rounded-lg h-48 animate-pulse"></div>
    ))}
  </div>
);

const Home = () => {
  const { user, isAuthenticated } = useCustomerAuth();

  // Add Organization structured data to homepage
  useStructuredData(ORGANIZATION_SCHEMA, "organization-schema");

  return (
    <div className="bg-black text-gray-800 font-sans">
      <Header />

      {/* Platform Update Banner */}
      <div className="relative bg-gradient-to-r from-amber-900/90 via-yellow-800/90 to-amber-900/90 border-b border-amber-700/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-amber-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-amber-100 font-semibold text-sm sm:text-base">
                  Platform Enhancement in Progress
                </h3>
                <p className="text-amber-200/80 text-xs sm:text-sm mt-0.5">
                  We're actively improving your shopping experience. Some
                  features may be temporarily unavailable as our team works to
                  bring you the best possible service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero section with lazy loading */}
        <Suspense fallback={<HeroSkeleton />}>
          <HeroCarousel />
        </Suspense>

        {/* Categories load immediately for navigation */}
        <Categories />

        {/* Featured products with lazy loading */}
        <Suspense fallback={<ProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>

        {/* Lazy load recommendations based on authentication */}
        {isAuthenticated && user && (
          <div className="my-12">
            <Suspense fallback={<ProductsSkeleton />}>
              <RecommendationSection
                userId={user.id}
                title="Recommended for You"
                context="homepage"
              />
            </Suspense>
          </div>
        )}

        {!isAuthenticated && (
          <div className="my-12">
            <Suspense fallback={<ProductsSkeleton />}>
              <RecommendationSection
                userId={null}
                title="Popular Items"
                context="homepage_guest"
              />
            </Suspense>
          </div>
        )}
      </main>

      <Footer />

      {/* Lazy load scroll button */}
      <Suspense fallback={null}>
        <ScrollToTopButton />
      </Suspense>
    </div>
  );
};

export default Home;
