/* eslint-disable no-unused-vars */
import {
  Star,
  Heart,
  Share2,
  Shield,
  Truck,
  ArrowLeft,
  CheckCircle,
  Camera,
  MessageSquare,
  ThumbsUp,
  Award,
  Gem,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Zap,
  Users,
  Globe,
  Package,
  RotateCcw,
  CreditCard,
  Tag,
  Clock,
  Eye,
  ShoppingBag,
  Filter,
  ChevronDown,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AddToCartButton from "../../components/AddToCartButton";
import { RecommendationSection } from "../../components/RecommendationSection";
import {
  fetchReviews,
  fetchUserId,
  submitReview,
  uploadFile,
} from "../../CustomerServices";
import { formatPrice } from "../../utils/priceFormatter";
import axiosClient from "../../api";
import { useCustomerAuth } from "../../Context/CustomerAuthContext";

// Premium StarRating Component
const StarRating = ({
  rating,
  size = "md",
  interactive = false,
  onRatingSelect,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            className={`relative group transition-transform duration-200 hover:scale-110 ${
              interactive ? "cursor-pointer" : "cursor-default"
            }`}
            onClick={() =>
              interactive && onRatingSelect && onRatingSelect(star)
            }
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <div className={`${sizes[size]} relative`}>
              {/* Star Background */}
              <div
                className={`absolute inset-0 rounded-full ${
                  isFilled
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                    : "bg-gray-800/50 border border-amber-800/30"
                }`}
              ></div>

              {/* Star Icon */}
              <svg
                className={`relative ${sizes[size]} ${
                  isFilled ? "text-yellow-300 fill-current" : "text-gray-600"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>

              {/* Glow Effect */}
              {isFilled && (
                <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-md"></div>
              )}
            </div>

            {/* Hover Tooltip */}
            {interactive && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {star} star{star !== 1 ? "s" : ""}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useCustomerAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSignUpModalVisible, setIsSignUpModalVisible] = useState(false);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await axiosClient(`/api/products/${id}`);
        const data = res.data;
        setProduct(data);
        if (data && data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
          fetchReviews(data.$id).then(setReviews);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Fetch reviews separately
  useEffect(() => {
    if (product?.$id) {
      fetchReviews(product.$id).then(setReviews);
    }
  }, [product]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsSignUpModalVisible(true); // Show a sign-up modal
      return;
    }

    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const userId = user?.id || (await fetchUserId()); // Ensure fetchUserId is a web-compatible function

      if (!userId) {
        console.error("User is not logged in or ID is missing");
        alert("Login Required", "You need to log in to post a review.");
        return;
      }

      if (!product || !product.$id) {
        console.error("Product is missing or ID is undefined");
        return;
      }

      const cleanedReviewText = reviewText.trim();
      let imageUrls = [];

      let validatedRating = null;
      if (selectedRating !== null && selectedRating !== undefined) {
        const parsedRating = Number(selectedRating);
        if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
          validatedRating = parsedRating;
        }
      }

      // Validate that at least rating or review text is provided
      if (!validatedRating && !cleanedReviewText) {
        alert("Please provide either a rating or a review text.");
        return;
      }

      // Web file handling: upload and get public URLs for multiple images
      if (selectedImages && selectedImages.length > 0) {
        try {
          const urls = await Promise.all(
            selectedImages.map(async (file) => await uploadFile(file)),
          );
          imageUrls = urls.filter(Boolean);
          if (imageUrls.length === 0) {
            alert(
              "Upload Failed",
              "Failed to upload selected images. Your review will be submitted without them.",
            );
          }
        } catch (error) {
          console.error("Error uploading files:", error);
          alert(
            "Upload Error",
            "Failed to upload the images. Please try again.",
          );
          return;
        }
      }

      await submitReview({
        productId: product.$id,
        reviewText: cleanedReviewText,
        rating: validatedRating,
        image: imageUrls.length === 1 ? imageUrls[0] : undefined,
        images: imageUrls.length > 1 ? imageUrls : undefined,
      });

      setReviewText("");
      setSelectedImages([]);
      setSelectedRating(0); // Reset the rating

      // Refresh reviews after successful submission
      const updatedReviews = await fetchReviews(product.$id);
      setReviews(updatedReviews);
    } catch (error) {
      console.error("Failed to add review:", error);
      alert("Failed to add review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title =
      product?.productName || product?.name || "Check out this product";
    const text = `Check out this amazing ${
      product?.productName || product?.name
    } from Nile Flow!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        console.log("Error sharing:", error);
        // Fallback to clipboard
        await copyToClipboard(url);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Link copied to clipboard!");
    }
  };

  const handleImageNavigation = (direction) => {
    if (!product?.images) return;
    const newIndex =
      direction === "next"
        ? (currentImageIndex + 1) % product.images.length
        : (currentImageIndex - 1 + product.images.length) %
          product.images.length;
    setCurrentImageIndex(newIndex);
    setActiveImage(product.images[newIndex]);
  };

  const handleReply = async (reviewId) => {
    if (!isAuthenticated) {
      setIsSignUpModalVisible(true);
      return;
    }

    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      // Assuming there's a reply API endpoint
      await submitReview({
        productId: product.$id,
        reviewText: replyText.trim(),
        parentReviewId: reviewId, // Assuming the API supports parent review ID
      });

      setReplyText("");
      setReplyingTo(null);

      // Refresh reviews
      const updatedReviews = await fetchReviews(product.$id);
      setReviews(updatedReviews);
    } catch (error) {
      console.error("Failed to submit reply:", error);
      alert("Failed to submit reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Just now";

      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return "Just now";
    }
  };

  const getDisplayedDescription = () => {
    if (!product?.description) return "";
    const maxLength = 200;
    if (product.description.length <= maxLength || isDescriptionExpanded) {
      return product.description;
    }
    return product.description.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 pb-20">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gem className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>
          </div>
          <h3 className="mt-8 text-2xl font-bold text-amber-200">
            Loading Premium Product
          </h3>
          <p className="text-gray-400 mt-2">
            Discovering authentic African treasure...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 pb-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
            <Package className="w-12 h-12 text-amber-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4">
            Product Not Found
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            The authentic African product you're looking for doesn't exist or an
            error occurred.
          </p>
          <a
            href="/shop"
            className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Browse Products</span>
          </a>
        </div>
        <Footer />
      </div>
    );
  }
  /*   console.log("Product data:", product);
  console.log("Product price type:", typeof product?.price);
  console.log("Product price value:", product?.price);
 */
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + (review.rating || 0), 0) /
        reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Product Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-gray-900/10 to-emerald-900/10"></div>
        <div className="relative max-w-8xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Images */}
            <div className="space-y-6">
              {/* Main Image */}
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden border border-amber-800/30">
                <div className="relative h-96 md:h-[500px] flex items-center justify-center">
                  {activeImage && (
                    <img
                      src={activeImage}
                      alt={product.productName}
                      className="max-h-full max-w-full object-contain p-4"
                    />
                  )}

                  {/* Navigation Arrows */}
                  {product.images?.length > 1 && (
                    <>
                      <button
                        onClick={() => handleImageNavigation("prev")}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 border border-amber-700/30"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleImageNavigation("next")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 border border-amber-700/30"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.isOnSale && (
                      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                        <Tag className="w-4 h-4" />
                        <span>LIMITED SALE</span>
                      </div>
                    )}
                    <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>PREMIUM</span>
                    </div>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={() => setWishlisted(!wishlisted)}
                    className={`absolute top-4 right-4 w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 ${
                      wishlisted
                        ? "bg-gradient-to-r from-red-600 to-pink-600 border-red-500/50 text-white"
                        : "bg-gradient-to-r from-gray-900/80 to-black/80 border-amber-700/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50"
                    } hover:scale-110`}
                  >
                    <Heart
                      className={`w-6 h-6 ${wishlisted ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActiveImage(img);
                        setCurrentImageIndex(index);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                        activeImage === img
                          ? "border-amber-500 scale-105"
                          : "border-amber-800/30 hover:border-amber-500/50"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-amber-700/30 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-medium">
                    Premium Collection
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  {product.productName}
                </h1>

                <div className="flex items-center space-x-4 mb-6">
                  <StarRating rating={averageRating} size="lg" />
                  <span className="text-gray-300">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>

                {product.vendorName && (
                  <div className="mb-4">
                    <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-700/30">
                      <span className="text-emerald-200 text-sm font-medium">
                        Brand:{" "}
                        {product.vendorName || product.brand || "Unknown"}
                      </span>
                    </span>
                  </div>
                )}

                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {getDisplayedDescription()}
                </p>
                {product?.description && product.description.length > 200 && (
                  <button
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    className="text-amber-400 hover:text-amber-300 font-semibold transition-colors duration-200 mb-6"
                  >
                    {isDescriptionExpanded ? "See Less" : "See More"}
                  </button>
                )}
              </div>

              {/* Price Section */}
              <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-gray-400 line-through text-lg sm:text-xl md:text-2xl">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {product.originalPrice && (
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-900/40 to-amber-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-red-700/30">
                    <Zap className="w-4 h-4 text-red-400" />
                    <span className="text-red-200 font-bold">
                      Save {formatPrice(product.originalPrice - product.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="space-y-4">
                <label className="text-amber-200 font-medium">Quantity</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-6 py-3 text-white font-bold text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-amber-100/70 text-sm">
                    {product.stock || "Limited"} items available
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <AddToCartButton
                  product={product}
                  quantity={quantity}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-6 h-6" />
                  <span>Add to Cart</span>
                </AddToCartButton>

                <button
                  onClick={handleShare}
                  className="px-6 py-4 border-2 border-amber-500/50 text-amber-400 font-bold rounded-xl hover:bg-amber-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Reviews Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Customer Reviews
                </h2>
                <p className="text-gray-300">
                  Authentic feedback from our African community
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-center bg-gradient-to-br from-amber-900/20 to-yellow-900/20 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-amber-300">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-amber-100/80 text-sm">
                    Average Rating
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Grid */}
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.slice(0, visibleReviewsCount).map((review, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 group hover:border-amber-500/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={review.avatar || "/placeholder-avatar.png"}
                            alt={review.userName}
                            className="w-12 h-12 rounded-full border-2 border-amber-800/30"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-white">
                            {review.userName}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Verified Purchase
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRating rating={review.rating} size="sm" />
                        <p className="text-gray-400 text-sm mt-1">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {review.text}
                    </p>
                    {(() => {
                      let images = [];
                      // Prefer explicit images array if present
                      if (
                        Array.isArray(review.images) &&
                        review.images.length > 0
                      ) {
                        images = review.images;
                      } else if (review.image) {
                        // Handle single URL or JSON-stringified array of URLs
                        try {
                          const parsed = JSON.parse(review.image);
                          if (Array.isArray(parsed)) {
                            images = parsed;
                          } else if (typeof parsed === "string") {
                            images = [parsed];
                          } else {
                            images = [review.image];
                          }
                        } catch (e) {
                          images = [review.image];
                        }
                      }
                      images = images.filter(Boolean);
                      if (!images.length) return null;
                      return (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {images.map((src, idx) => (
                            <img
                              key={idx}
                              src={src}
                              alt={`Review ${idx + 1}`}
                              className="w-32 h-32 rounded-lg object-cover border border-amber-800/30"
                            />
                          ))}
                        </div>
                      );
                    })()}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-amber-800/30">
                      <button className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-sm">Helpful</span>
                      </button>
                      <button
                        onClick={() =>
                          setReplyingTo(replyingTo === index ? null : index)
                        }
                        className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm">Reply</span>
                      </button>
                    </div>

                    {/* Reply Form */}
                    {replyingTo === index && (
                      <div className="mt-6 pt-6 border-t border-amber-800/30">
                        <div className="space-y-4">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full h-24 px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                            placeholder="Write your reply..."
                          />
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              className="px-4 py-2 text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReply(review.id || index)}
                              disabled={isSubmittingReply || !replyText.trim()}
                              className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {isSubmittingReply ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Replying...</span>
                                </>
                              ) : (
                                <span>Reply</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                  <MessageSquare className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  No Reviews Yet
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Be the first to share your experience with this premium
                  African product!
                </p>
              </div>
            )}

            {/* Show More/Less */}
            <div className="flex justify-center mt-8 gap-4">
              {reviews.length > visibleReviewsCount && (
                <button
                  onClick={() => setVisibleReviewsCount(reviews.length)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm border border-amber-700/40 rounded-xl hover:border-amber-500/60 transition-all duration-300 flex items-center space-x-2"
                >
                  <span className="text-amber-200 font-medium">
                    Show All Reviews ({reviews.length - visibleReviewsCount}{" "}
                    more)
                  </span>
                  <ChevronDown className="w-5 h-5 text-amber-400" />
                </button>
              )}

              {visibleReviewsCount > 3 && (
                <button
                  onClick={() => setVisibleReviewsCount(3)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl hover:border-amber-500/50 transition-all duration-300 text-amber-200 font-medium"
                >
                  Show Less
                </button>
              )}
            </div>
          </div>

          {/* Add Review Form */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-amber-200">
                  Share Your Experience
                </h3>
                <p className="text-amber-100/70">
                  Rate the product, write a review, or do both!
                </p>
              </div>
            </div>

            <form onSubmit={handleAddReview} className="space-y-6">
              <div>
                <label className="block text-amber-100 font-medium mb-3">
                  Your Rating (Optional)
                </label>
                <StarRating
                  rating={selectedRating}
                  interactive={true}
                  onRatingSelect={setSelectedRating}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-amber-100 font-medium mb-3">
                  Your Review (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="relative w-full h-40 px-4 py-3 bg-gray-900/50 border border-amber-800/50 rounded-xl text-amber-100 placeholder-amber-100/50 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    placeholder="Share your authentic experience with this African product..."
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="block text-amber-100 font-medium mb-3">
                  Add Photos (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-xl blur opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-4 p-4 bg-gray-900/50 border border-amber-800/50 rounded-xl">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-amber-800/30 flex items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors">
                      <Camera className="w-8 h-8 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-amber-100">
                        Upload photos of your product
                      </p>
                      <p className="text-amber-100/70 text-sm">
                        Support JPG, PNG up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        setSelectedImages((prev) => [...prev, ...files]);
                        if (fileInputRef.current)
                          fileInputRef.current.value = null;
                      }}
                      id="reviewImages"
                    />
                    <label
                      htmlFor="reviewImages"
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 cursor-pointer"
                    >
                      Browse
                    </label>
                  </div>
                </div>
                {selectedImages && selectedImages.length > 0 && (
                  <div className="mt-3 text-amber-300 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Selected: {selectedImages.length} image(s)</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedImages.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-gray-900/40 border border-amber-800/40 rounded-lg px-2 py-1"
                        >
                          <span className="text-amber-200/80 text-xs">
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedImages((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="text-red-300 hover:text-red-200 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting || (!selectedRating && !reviewText.trim())
                }
                className="w-full px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-6 h-6" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Related Product Recommendations */}
          <div className="mt-16 mb-8">
            {user ? (
              <RecommendationSection
                userId={user.id}
                category={product?.category}
                title="You might also like"
                context="product_detail"
              />
            ) : (
              <RecommendationSection
                userId={null}
                category={product?.category}
                title="Customers also viewed"
                context="product_detail_guest"
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
