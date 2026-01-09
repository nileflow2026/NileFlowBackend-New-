import React from "react";

export default function MilesProgress({ nileMilesData, nileMilesLoading }) {
  if (nileMilesLoading) {
    return <p>Loading your progress...</p>;
  }

  // Pull the real miles from your state
  const miles = nileMilesData?.currentMiles || 0;

  // 🎯 Define milestone tiers
  // 🎯 Define milestone tiers with medals
  const tiers = [
    {
      name: "Bronze Explorer",
      threshold: 0,
      icon: "🥉",
      color: "text-amber-700",
    },
    {
      name: "Silver Pathfinder",
      threshold: 100,
      icon: "🥈",
      color: "text-gray-400",
    },
    {
      name: "Gold Voyager",
      threshold: 250,
      icon: "🥇",
      color: "text-yellow-500",
    },
    {
      name: "Platinum Legend",
      threshold: 500,
      icon: "💎",
      color: "text-cyan-400",
    },
    {
      name: "Diamond Guardian",
      threshold: 1000,
      icon: "👑",
      color: "text-purple-500",
    },
  ];

  // 🏆 Find current tier
  const currentTier =
    tiers
      .slice()
      .reverse()
      .find((tier) => miles >= tier.threshold) || tiers[0];

  // 🎯 Find next milestone
  const nextTier =
    tiers.find((tier) => tier.threshold > miles) || tiers[tiers.length - 1];

  // Define your milestones (can be static or fetched from backend later)
  const milestones = [100, 250, 500, 1000];
  const nextMilestone =
    milestones.find((m) => m > miles) || milestones[milestones.length - 1];

  // Calculate progress toward the next milestone
  const progress = Math.min((miles / nextMilestone) * 100, 100);

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold mb-2 text-white">
        Your Nile Miles Journey
      </h2>

      {/* Current Tier */}
      <p className="text-sm font-medium mb-1 flex items-center gap-2 text-white">
        Current Rank:{" "}
        <span
          className={`font-bold flex items-center gap-1 ${currentTier.color}`}
        >
          {currentTier.icon} {currentTier.name}
        </span>
      </p>

      {/* Miles + Next Goal */}
      <p className="text-sm mb-4 text-white">
        {miles} miles → Next:{" "}
        <span className="font-semibold flex items-center gap-1 text-white">
          {nextTier.icon} {nextTier.name}
        </span>{" "}
        at {nextTier.threshold} miles
      </p>

      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />

        {/* Tier checkpoints */}
        {tiers.map((tier, index) => {
          const left =
            (tier.threshold / tiers[tiers.length - 1].threshold) * 100;
          return (
            <div
              key={index}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${left}%` }}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                ${
                  miles >= tier.threshold
                    ? "bg-amber-500 text-white"
                    : "bg-white text-amber-500 border border-amber-400"
                }`}
              >
                {tier.icon}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tier thresholds */}
      <div className="flex justify-between mt-2 text-xs text-amber-700">
        {tiers.map((tier, index) => (
          <span key={index} className="text-center w-12">
            {tier.threshold}
          </span>
        ))}
      </div>

      {/* <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden relative">
        <div
          className="h-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-inner transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-orange-200/10 to-red-200/20 blur-sm"></div>
      </div> */}

      {/* Miles Left */}
      <p className="text-xs mt-3 text-gray-600 dark:text-gray-300">
        {nextTier.threshold - miles > 0
          ? `${nextTier.threshold - miles} miles left to reach ${
              nextTier.name
            } 🚀`
          : "You’ve reached the highest rank! 🌟"}
      </p>
    </div>
  );
}
