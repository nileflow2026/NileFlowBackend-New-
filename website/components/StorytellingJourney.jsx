/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import axiosClient from "../api";
import MilesProgress from "./MilesProgress";

// components/StorytellingJourney.jsx
const StorytellingJourney = ({
  title,
  description,
  products,
  nileMilesData,
  nileMilesLoading,
  user, // 👈 pass logged-in user so we have userId
  refreshMiles, // 👈 callback to refetch miles after redemption
}) => {
  const userMiles = nileMilesData?.currentMiles || 0;
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await axiosClient.get("/api/nilemiles/rewards");
        if (res.data.success) {
          setRewards(res.data.rewards);
        }
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
      }
    };
    fetchRewards();
  }, []);

  const handleRedeem = async (rewardKey, requiredMiles) => {
    try {
      const res = await axiosClient.post("/api/nilemiles/redeem", {
        userId: user.userId,
        rewardKey,
      });

      if (res.data.success) {
        alert(`🎉 You unlocked: ${res.data.reward}!`);
        refreshMiles(); // re-fetch miles so UI updates
      } else {
        alert("❌ Failed to redeem: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Redeem error:", err);
      alert("Server error while redeeming reward.");
    }
  };
  return (
    <section className="bg-gradient-to-b from-amber-50 to-white py-16">
      {/* Category Intro */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900 animate-fadeInDown">
          {title}
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-gray-700 mt-4 animate-fadeInUp">
          {description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto mb-10">
        <p className="font-bold mb-2">Your Journey</p>
        {/* Live Nile Miles Progress */}
        <div className="max-w-3xl mx-auto mb-10">
          <MilesProgress
            nileMilesData={nileMilesData}
            nileMilesLoading={nileMilesLoading}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Explorer Level: {userMiles} miles
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">
        {rewards.map((item, i) => {
          const isUnlocked = userMiles >= item.requiredMiles;
          return (
            <div
              key={i}
              className={`bg-white shadow-lg rounded-2xl overflow-hidden 
                ${isUnlocked ? "hover:shadow-2xl" : "opacity-60"}
                transition transform hover:-translate-y-1`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 italic">{item.lore}</p>

                {isUnlocked ? (
                  <button
                    onClick={() =>
                      handleRedeem(item.rewardKey, item.requiredMiles)
                    }
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                  >
                    🎁 Unlock Now
                  </button>
                ) : (
                  <button
                    className="mt-4 px-4 py-2 bg-gray-400 text-white rounded-full cursor-not-allowed"
                    disabled
                  >
                    🔒 Unlocks at {item.requiredMiles} miles
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Products with Unlock Logic */}
      {/*  <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">
        {products.map((item, i) => {
          const isUnlocked = userMiles >= item.requiredMiles;
          return (
            <div
              key={i}
              className={`bg-white shadow-lg rounded-2xl overflow-hidden 
                ${isUnlocked ? "hover:shadow-2xl" : "opacity-60"}
                transition transform hover:-translate-y-1`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 italic">{item.lore}</p>
                {isUnlocked ? (
                  <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700">
                    ✅ Unlocked
                  </button>
                ) : (
                  <button
                    className="mt-4 px-4 py-2 bg-gray-400 text-white rounded-full cursor-not-allowed"
                    disabled
                  >
                    🔒 Unlocks at {item.requiredMiles} miles
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div> */}
    </section>
  );
};

export default StorytellingJourney;
