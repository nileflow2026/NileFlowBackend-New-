/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // require library stylesheet
import { Carousel } from "react-responsive-carousel";
import { motion } from "framer-motion";
import axiosClient from "../api";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const Hero = () => {
  const [activeSlide, setActiveSlide] = useState(0); // This state is no longer needed but kept for potential future use
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        setLoading(true);

        // Fetch featured and deals data in parallel
        const [featuredResponse, dealsResponse] = await axiosClient.get(
          "/api/customerprofile/hero-products"
        );

        const featuredData = featuredResponse.data;
        const dealsData = dealsResponse.data;

        // Process each dataset separately
        const featuredSlides = featuredData
          .map((item) => ({
            title: item.productName,
            subtitle: item.tag,
            img: item.image,
            link: `/product/${item.productId}`,
          }))
          .filter(
            (slide) =>
              slide.img && typeof slide.img === "string" && slide.img.length > 0
          );

        const dealsSlides = dealsData
          .map((item) => ({
            title: item.productName,
            subtitle: `Deal: ${item.discount}% OFF!`,
            img: item.image,
            link: `/product/${item.productId}`,
          }))
          .filter(
            (slide) =>
              slide.img && typeof slide.img === "string" && slide.img.length > 0
          );

        // Combine the results in your preferred order
        const allSlides = [...featuredSlides, ...dealsSlides];
        setHeroSlides(allSlides);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch hero section data:", error);
        setLoading(false);
      }
    };
    fetchHeroData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center">Loading hero section...</div>;
  }

  if (heroSlides.length === 0) {
    return <div className="p-12 text-center">No hero slides to display.</div>;
  }

  return (
    <section className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto mt-1.5 h-[450px]">
        {/* Replace Slider with Carousel component */}
        <Carousel
          showArrows={false}
          showStatus={false}
          showThumbs={false}
          infiniteLoop={heroSlides.length > 1}
          autoPlay={true}
          interval={4000}
          transitionTime={500}
          stopOnHover={true}
          // The onChange prop can be used similarly to beforeChange
          onChange={(index) => setActiveSlide(index)}
          className="h-full"
        >
          {heroSlides.map((slide, idx) => (
            <div key={idx} className="relative h-full">
              <img
                src={slide.img}
                alt={slide.title}
                className="w-full h-full object-cover rounded-md"
              />
              {/* Overlay content remains the same */}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-start p-8 md:p-16">
                <motion.h1
                  key={`title-${activeSlide}`}
                  className="text-3xl md:text-5xl font-extrabold text-white mb-4"
                  variants={fadeUpVariant}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  key={`subtitle-${activeSlide}`}
                  className="text-lg md:text-2xl text-gray-200 mb-6"
                  variants={fadeUpVariant}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {slide.subtitle}
                </motion.p>
                <motion.div
                  key={`buttons-${activeSlide}`}
                  className="flex gap-4"
                  variants={fadeUpVariant}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <a href={slide.link}>
                    <button className="bg-[#A35527] text-white px-6 py-3 rounded-full hover:bg-accent transition-colors duration-200">
                      SHOP NOW
                    </button>
                  </a>
                  <a href="/products">
                    <button className="bg-gray-700 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors duration-200">
                      EXPLORE CATEGORIES
                    </button>
                  </a>
                </motion.div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
};

export default Hero;
