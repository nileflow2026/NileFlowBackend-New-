/* eslint-disable no-unused-vars */
// Image optimization utilities
export const ImageOptimizer = {
  // Lazy loading image component
  LazyImage: ({ src, alt, className, placeholder, ...props }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
      const img = imgRef.current;
      if (!img) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const image = new Image();
            image.onload = () => {
              img.src = src;
              setImageLoaded(true);
            };
            image.onerror = () => {
              setImageError(true);
            };
            image.src = src;
            observer.unobserve(img);
          }
        },
        { rootMargin: "50px 0px" },
      );

      observer.observe(img);
      return () => observer.disconnect();
    }, [src]);

    return (
      <div className={`relative ${className}`}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse rounded" />
        )}
        <img
          ref={imgRef}
          alt={alt}
          className={`${className} ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
          loading="lazy"
          decoding="async"
          {...props}
        />
        {imageError && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Image unavailable</span>
          </div>
        )}
      </div>
    );
  },

  // WebP detection and fallback
  getOptimizedImageUrl: (url, options = {}) => {
    const { width, quality = 85, format = "auto" } = options;

    // Check WebP support
    const supportsWebP = (() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    })();

    // Return optimized URL based on support
    if (supportsWebP && format === "auto") {
      return url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
    }

    return url;
  },

  // Progressive image loading
  preloadImages: (urls) => {
    return Promise.all(
      urls.map((url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
      }),
    );
  },

  // Generate responsive image srcSet
  generateSrcSet: (baseUrl, sizes = [400, 800, 1200]) => {
    return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(", ");
  },
};

// React hooks for image optimization
import { useState, useEffect, useRef } from "react";

export const useImagePreloader = (imageSources) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!imageSources.length) return;

    let loadedCount = 0;
    const totalImages = imageSources.length;

    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          setLoadingProgress((loadedCount / totalImages) * 100);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all(imageSources.map(loadImage))
      .then(() => setImagesLoaded(true))
      .catch(console.error);
  }, [imageSources]);

  return { imagesLoaded, loadingProgress };
};

export default ImageOptimizer;
