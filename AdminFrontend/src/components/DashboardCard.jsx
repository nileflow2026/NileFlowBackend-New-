export default function DashboardCard({
  title,
  value,
  icon,
  color = "gold",
  trend = null,
  description = null,
}) {
  const colorSchemes = {
    gold: {
      bg: "bg-gradient-to-br from-[#FFF9E6] to-[#FFEBB2] dark:from-[#3A2C1A] dark:to-[#2A1C0A]",
      border: "border-[#FFD700] dark:border-[#D4A017]",
      text: "text-[#B8860B] dark:text-[#FFD700]",
      iconBg: "bg-gradient-to-r from-[#D4A017] to-[#B8860B]",
    },
    green: {
      bg: "bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#1A2C1A] dark:to-[#0A1C0A]",
      border: "border-[#4CAF50] dark:border-[#2ECC71]",
      text: "text-[#27AE60] dark:text-[#2ECC71]",
      iconBg: "bg-gradient-to-r from-[#27AE60] to-[#2ECC71]",
    },
    blue: {
      bg: "bg-gradient-to-br from-[#E8F4FD] to-[#C8E6F5] dark:from-[#1A2A3A] dark:to-[#0A1A2A]",
      border: "border-[#3498DB] dark:border-[#2980B9]",
      text: "text-[#2980B9] dark:text-[#3498DB]",
      iconBg: "bg-gradient-to-r from-[#3498DB] to-[#2980B9]",
    },
    purple: {
      bg: "bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] dark:from-[#2A1A3A] dark:to-[#1A0A2A]",
      border: "border-[#9B59B6] dark:border-[#8E44AD]",
      text: "text-[#8E44AD] dark:text-[#9B59B6]",
      iconBg: "bg-gradient-to-r from-[#9B59B6] to-[#8E44AD]",
    },
    orange: {
      bg: "bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] dark:from-[#3A2A1A] dark:to-[#2A1A0A]",
      border: "border-[#E67E22] dark:border-[#D35400]",
      text: "text-[#D35400] dark:text-[#E67E22]",
      iconBg: "bg-gradient-to-r from-[#E67E22] to-[#D35400]",
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.gold;

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl ${scheme.bg} border ${scheme.border} p-5 sm:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-opacity-100`}
    >
      {/* Decorative Pattern */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-current to-transparent rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <h3
            className={`text-sm font-semibold uppercase tracking-wider ${scheme.text}`}
          >
            {title}
          </h3>

          {icon && (
            <div
              className={`w-10 h-10 rounded-xl ${scheme.iconBg} flex items-center justify-center shadow-lg`}
            >
              <span className="text-white text-lg">{icon}</span>
            </div>
          )}
        </div>

        <p className="text-2xl sm:text-3xl font-bold text-[#2C1810] dark:text-[#F5E6D3] mb-2">
          {value}
        </p>

        {description && (
          <p className="text-xs text-[#8B4513]/70 dark:text-[#D4A017]/70 font-medium">
            {description}
          </p>
        )}

        {trend && (
          <div className="flex items-center mt-3">
            <div
              className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                trend > 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              <span className={trend > 0 ? "mr-1" : "mr-1 rotate-180"}>↗</span>
              {Math.abs(trend)}%
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              from last month
            </span>
          </div>
        )}
      </div>

      {/* Bottom accent bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${scheme.iconBg} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
      ></div>
    </div>
  );
}
