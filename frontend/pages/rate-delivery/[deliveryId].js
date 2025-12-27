import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const StarRating = ({ rating, onRatingChange, label, required = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-3xl focus:outline-none transition-colors"
          >
            <span
              className={
                star <= (hoverRating || rating)
                  ? "text-yellow-400"
                  : "text-gray-300"
              }
            >
              ⭐
            </span>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating ? `${rating}/5` : "Click to rate"}
        </span>
      </div>
    </div>
  );
};

const RateDeliveryPage = () => {
  const router = useRouter();
  const { deliveryId } = router.query;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [deliveryData, setDeliveryData] = useState(null);
  const [riderRating, setRiderRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (deliveryId) {
      checkRatingEligibility();
    }
  }, [deliveryId]);

  const checkRatingEligibility = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ratings/can-rate/${deliveryId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check rating eligibility");
      }

      if (!data.canRate) {
        setError(data.reason || "This delivery cannot be rated");
        setLoading(false);
        return;
      }

      setDeliveryData(data.delivery);
      setLoading(false);
    } catch (err) {
      console.error("Error checking rating eligibility:", err);
      setError(err.message || "Failed to load delivery information");
      setLoading(false);
    }
  };

  const submitRating = async (e) => {
    e.preventDefault();

    if (riderRating === 0) {
      setError("Please provide a rider rating");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch("/api/ratings/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryId,
          riderId: deliveryData.riderId,
          orderId: deliveryData.orderId,
          riderRating,
          deliveryRating: deliveryRating || riderRating, // Default to rider rating
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit rating");
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push("/thank-you-rating");
      }, 2000);
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery information...</p>
        </div>
      </div>
    );
  }

  if (error && !deliveryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Rate
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your rating has been submitted successfully. Your feedback helps us
            improve our service!
          </p>
          <div className="text-sm text-gray-500">
            Redirecting you shortly...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Rate Your Delivery - Nile Flow</title>
        <meta
          name="description"
          content="Rate your delivery experience with Nile Flow"
        />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rate Your Delivery Experience
            </h1>
            <p className="text-gray-600">
              Your feedback helps us improve our service and recognize our best
              riders
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Order Summary */}
            <div className="bg-blue-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Order Summary
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Order ID:</span>
                  <span className="ml-2 text-gray-900">
                    #{deliveryData?.orderId}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Delivery ID:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {deliveryData?.deliveryId}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rider:</span>
                  <span className="ml-2 text-gray-900">
                    {deliveryData?.riderName}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Total Amount:
                  </span>
                  <span className="ml-2 text-gray-900 font-semibold">
                    ${deliveryData?.totalAmount}
                  </span>
                </div>
              </div>
              {deliveryData?.completedAt && (
                <div className="mt-2 text-sm text-gray-600">
                  Delivered on{" "}
                  {new Date(deliveryData.completedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Rating Form */}
            <form onSubmit={submitRating} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <StarRating
                rating={riderRating}
                onRatingChange={setRiderRating}
                label="How would you rate your rider?"
                required
              />

              <StarRating
                rating={deliveryRating}
                onRatingChange={setDeliveryRating}
                label="How would you rate the overall delivery experience?"
              />

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your experience..."
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {comment.length}/500 characters
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting || riderRating === 0}
                  className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                    submitting || riderRating === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  }`}
                >
                  {submitting ? "Submitting..." : "Submit Rating"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Thank you for choosing Nile Flow for your delivery needs!</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RateDeliveryPage;
