import {
  FaTachometerAlt,
  FaUsers,
  FaClipboardList,
  FaBoxOpen,
  FaTimes,
  FaUserCog,
  FaBell,
  FaEnvelope,
  FaFileAlt,
  FaCog,
  FaNewspaper,
  FaComments,
  FaFileContract,
  FaMoneyBillWave,
  FaCalculator,
} from "react-icons/fa";

export default function Sidebar({ setSection, current, isOpen, setIsOpen }) {
  // Enhanced navigation items with proper icons and categories
  const navItems = [
    {
      category: "Core Operations",
      items: [
        {
          label: "Dashboard",
          icon: <FaTachometerAlt className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#D4A017] to-[#B8860B]",
        },
        {
          label: "Users",
          icon: <FaUsers className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#27AE60] to-[#2ECC71]",
        },
        {
          label: "Orders",
          icon: <FaClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#3498DB] to-[#2980B9]",
        },
        {
          label: "Products",
          icon: <FaBoxOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#9B59B6] to-[#8E44AD]",
        },
        {
          label: "Staff",
          icon: <FaUserCog className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#E74C3C] to-[#C0392B]",
        },
        {
          label: "Approved Products",
          icon: <FaUserCog className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#E74C3C] to-[#C0392B]",
        },
      ],
    },
    {
      category: "Engagement",
      items: [
        {
          label: "Admin Actions",
          icon: <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#F39C12] to-[#D68910]",
        },
        {
          label: "NewsLetter",
          icon: <FaNewspaper className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#1ABC9C] to-[#16A085]",
        },
        {
          label: "Customer Messages",
          icon: <FaComments className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#34495E] to-[#2C3E50]",
        },
      ],
    },
    {
      category: "Management",
      items: [
        {
          label: "Applications",
          icon: <FaFileContract className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#E67E22] to-[#D35400]",
        },
        {
          label: "Commission",
          icon: <FaMoneyBillWave className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#D4A017] to-[#B8860B]",
        },
        {
          label: "Finance",
          icon: <FaCalculator className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#2ECC71] to-[#27AE60]",
        },
        {
          label: "Settings",
          icon: <FaCog className="w-4 h-4 sm:w-5 sm:h-5" />,
          color: "from-[#7F8C8D] to-[#616A6B]",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#2C1810]/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative z-50 flex flex-col w-64 md:w-72 h-full transform transition-all duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E6] to-[#FAF7F2]
          dark:from-[#1A1A1A] dark:via-[#242424] dark:to-[#1A1A1A]
          border-r border-[#E8D6B5]/50 dark:border-[#3A3A3A]
          shadow-[4px_0_20px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_20px_rgba(0,0,0,0.3)]`}
        aria-label="Main navigation"
      >
        {/* Header Section */}
        <div className="relative px-6 pt-8 pb-6 border-b border-[#E8D6B5] dark:border-[#3A3A3A]">
          {/* Close Button - Mobile Only */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-4 p-2 rounded-full hover:bg-[#E8D6B5]/30 dark:hover:bg-[#3A3A3A] transition-colors duration-200 md:hidden focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
            aria-label="Close sidebar"
          >
            <FaTimes className="w-5 h-5 text-[#8B4513] dark:text-[#D4A017]" />
          </button>

          {/* Branding */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#8B6914] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">NF</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#27AE60] rounded-full border-2 border-white dark:border-[#1A1A1A]"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#D4A017] to-[#8B6914] bg-clip-text text-transparent">
                Nile Flow
              </h2>
              <p className="text-xs font-medium text-[#8B4513] dark:text-[#D4A017] uppercase tracking-wider">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-4 p-3 rounded-lg bg-[#E8D6B5]/20 dark:bg-[#3A3A3A]/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3]">
                System Status
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse"></div>
                <span className="text-xs font-bold text-[#27AE60]">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          {navItems.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8 last:mb-0">
              {/* Category Label */}
              <h3 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-[#8B4513]/70 dark:text-[#D4A017]/70">
                {category.category}
              </h3>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {category.items.map(({ label, icon, color }) => {
                  const isActive = current === label;

                  return (
                    <button
                      key={label}
                      onClick={() => {
                        setSection(label);
                        // Auto-close sidebar on mobile after selection
                        if (window.innerWidth < 768) {
                          setIsOpen(false);
                        }
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? `bg-gradient-to-r ${color} text-white shadow-lg transform scale-[1.02]`
                            : "text-[#2C1810] dark:text-[#F5E6D3] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] hover:translate-x-1"
                        } focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {/* Icon Container */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center
                        ${
                          isActive
                            ? "bg-white/20 backdrop-blur-sm"
                            : `bg-gradient-to-r ${color} bg-opacity-10`
                        }`}
                      >
                        <div
                          className={
                            isActive
                              ? "text-white"
                              : `bg-gradient-to-r ${color} bg-clip-text text-transparent`
                          }
                        >
                          {icon}
                        </div>
                      </div>

                      {/* Label */}
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "text-white" : ""
                        }`}
                      >
                        {label}
                      </span>

                      {/* Active Indicator */}
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="px-4 py-6 border-t border-[#E8D6B5] dark:border-[#3A3A3A]">
          <div className="px-3 py-4 rounded-xl bg-gradient-to-r from-[#E8D6B5]/20 to-[#D4A017]/10 dark:from-[#3A3A3A]/50 dark:to-[#3A3A3A]/30 backdrop-blur-sm">
            <p className="text-xs text-[#8B4513] dark:text-[#D4A017] font-medium mb-1">
              Powered by Nile Mart
            </p>
            <p className="text-[10px] text-[#8B4513]/70 dark:text-[#D4A017]/70">
              Elevating African commerce through technology
            </p>
          </div>
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d4a017 transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #d4a017, #b8860b);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #b8860b, #8b6914);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
