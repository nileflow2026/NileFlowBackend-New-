import React from "react";
import Header from "../../components/Header"; // Assuming Header.jsx is in the same directory
import Categories from "../../components/Categories"; // Assuming Categories.jsx is in the same directory
import FeaturedProducts from "../../components/FeaturedProducts"; // Assuming FeaturedProducts.jsx is in the same directory
import Footer from "../../components/Footer";
import HeroCarousel from "../../components/HeroCarousel ";
import PremiumBanner from "../../components/PremiumBanner";
import { RecommendationSection } from "../../components/RecommendationSection";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";

const Home = () => {
  const { user, isAuthenticated } = useCustomerAuth();

  return (
    <div className="bg-black text-gray-800 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroCarousel />

        <PremiumBanner />

        <Categories />

        <FeaturedProducts />

        {/* Show personalized recommendations for authenticated users */}
        {isAuthenticated && user && (
          <div className="my-12">
            <RecommendationSection
              userId={user.id}
              title="Recommended for You"
              context="homepage"
            />
          </div>
        )}

        {/* Show general recommendations for non-authenticated users */}
        {!isAuthenticated && (
          <div className="my-12">
            <RecommendationSection
              userId={null}
              title="Popular Items"
              context="homepage_guest"
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
