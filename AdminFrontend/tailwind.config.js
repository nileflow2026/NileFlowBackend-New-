/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      // African-inspired color palette
      colors: {
        // Primary African Sun Colors
        "sun-gold": {
          50: "#FFF9E6",
          100: "#FFF3CC",
          200: "#FFE699",
          300: "#FFDA66",
          400: "#FFCD33",
          500: "#FFC107",
          600: "#D4A017", // Primary gold
          700: "#B8860B",
          800: "#8B6914",
          900: "#5D430B",
        },

        // Earth Tones
        earth: {
          50: "#FAF7F2",
          100: "#F5F0E6",
          200: "#E8D6B5",
          300: "#D4B999",
          400: "#C09C7D",
          500: "#8B4513", // Terracotta
          600: "#734011",
          700: "#5C320E",
          800: "#44250A",
          900: "#2C1810", // Dark earth
        },

        // African Sky & Water
        sky: {
          50: "#E8F4FD",
          100: "#D1E9FB",
          200: "#A3D3F7",
          300: "#75BDF3",
          400: "#47A7EF",
          500: "#3498DB",
          600: "#2980B9",
          700: "#1F6091",
          800: "#15406A",
          900: "#0A2043",
        },

        // African Flora
        flora: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#27AE60",
          600: "#2ECC71",
          700: "#1E7E34",
          800: "#145A32",
          900: "#0D3B1E",
        },

        // African Sunset
        sunset: {
          50: "#FFF3E0",
          100: "#FFE0B2",
          200: "#FFCC80",
          300: "#FFB74D",
          400: "#FFA726",
          500: "#FF9800",
          600: "#F57C00",
          700: "#EF6C00",
          800: "#E65100",
          900: "#BF360C",
        },

        // Additional accents
        accent: {
          purple: "#9B59B6",
          "purple-dark": "#8E44AD",
          red: "#E74C3C",
          "red-dark": "#C0392B",
          yellow: "#F1C40F",
          "yellow-dark": "#F39C12",
        },
      },

      // African-inspired gradients
      backgroundImage: {
        "sun-gradient":
          "linear-gradient(135deg, #D4A017 0%, #B8860B 50%, #8B6914 100%)",
        "earth-gradient":
          "linear-gradient(135deg, #FAF7F2 0%, #F5F0E6 50%, #E8D6B5 100%)",
        "sky-gradient":
          "linear-gradient(135deg, #3498DB 0%, #2980B9 50%, #1F6091 100%)",
        "flora-gradient":
          "linear-gradient(135deg, #27AE60 0%, #2ECC71 50%, #1E7E34 100%)",
        "sunset-gradient":
          "linear-gradient(135deg, #FF9800 0%, #F57C00 50%, #E65100 100%)",
        "african-gradient":
          "linear-gradient(135deg, #D4A017 0%, #27AE60 25%, #3498DB 50%, #9B59B6 75%, #E74C3C 100%)",

        // Text gradients
        "text-sun": "linear-gradient(90deg, #D4A017 0%, #B8860B 100%)",
        "text-earth": "linear-gradient(90deg, #8B4513 0%, #2C1810 100%)",
      },

      // Custom spacing scale (8px base)
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        34: "8.5rem",
        38: "9.5rem",
        42: "10.5rem",
        46: "11.5rem",
        50: "12.5rem",
        54: "13.5rem",
        58: "14.5rem",
        62: "15.5rem",
        66: "16.5rem",
        70: "17.5rem",
        74: "18.5rem",
        78: "19.5rem",
        82: "20.5rem",
        86: "21.5rem",
        90: "22.5rem",
        94: "23.5rem",
        98: "24.5rem",
      },

      // Extended font sizes
      fontSize: {
        xxs: "0.625rem",
        "3xl": "1.75rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
        "7xl": "3.5rem",
        "8xl": "4rem",
        "9xl": "4.5rem",
        "10xl": "5rem",
      },

      // Border radius scale
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
        full: "9999px",
      },

      // Box shadows
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 20px -3px rgba(0, 0, 0, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.04)",
        hard: "0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 20px 50px -15px rgba(0, 0, 0, 0.1)",
        "inner-lg": "inset 0 4px 15px 0 rgba(0, 0, 0, 0.1)",
        african:
          "0 10px 30px rgba(212, 160, 23, 0.2), 0 4px 10px rgba(139, 69, 19, 0.1)",
        glow: "0 0 20px rgba(212, 160, 23, 0.3)",
        "glow-green": "0 0 20px rgba(39, 174, 96, 0.3)",
        "glow-blue": "0 0 20px rgba(52, 152, 219, 0.3)",
      },

      // Animations
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "spin-slow": "spin 3s linear infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "scale-up": "scaleUp 0.2s ease-out",
        ripple: "ripple 0.6s linear",
        shimmer: "shimmer 2s infinite",
        float: "float 6s ease-in-out infinite",
        wave: "wave 1.5s linear infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleUp: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },

      // Transition properties
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
        transform: "transform",
        shadow: "box-shadow",
        border: "border-color, border-width",
        bg: "background-color",
        colors: "background-color, border-color, color, fill, stroke",
      },

      transitionDuration: {
        400: "400ms",
        600: "600ms",
        800: "800ms",
        1200: "1200ms",
        2000: "2000ms",
      },

      transitionTimingFunction: {
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      // Custom utilities
      backdropBlur: {
        xs: "2px",
      },

      // Grid configuration
      gridTemplateColumns: {
        24: "repeat(24, minmax(0, 1fr))",
        16: "repeat(16, minmax(0, 1fr))",
      },

      // Aspect ratios
      aspectRatio: {
        "4/3": "4 / 3",
        "3/2": "3 / 2",
        "2/3": "2 / 3",
        "9/16": "9 / 16",
      },

      // Line clamp
      lineClamp: {
        7: "7",
        8: "8",
        9: "9",
        10: "10",
      },

      // Z-index scale
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },

      // Scroll behavior
      scrollBehavior: ["smooth"],
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/line-clamp"),
    require("tailwind-scrollbar-hide"),
    require("tailwindcss-animate"),

    // Custom plugin for African design utilities
    function ({ addUtilities, theme }) {
      const newUtilities = {
        // Text gradients
        ".text-gradient-sun": {
          background: "linear-gradient(90deg, #D4A017 0%, #B8860B 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".text-gradient-earth": {
          background: "linear-gradient(90deg, #8B4513 0%, #2C1810 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".text-gradient-sky": {
          background: "linear-gradient(90deg, #3498DB 0%, #2980B9 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },

        // African patterns
        ".pattern-dots": {
          "background-image":
            "radial-gradient(currentColor 1px, transparent 1px)",
          "background-size": "10px 10px",
        },
        ".pattern-lines": {
          "background-image":
            "repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 10px)",
          "background-size": "20px 20px",
        },

        // Custom scrollbar
        ".scrollbar-african": {
          "scrollbar-width": "thin",
          "scrollbar-color": "#D4A017 transparent",
        },
        ".scrollbar-african::-webkit-scrollbar": {
          width: "6px",
        },
        ".scrollbar-african::-webkit-scrollbar-track": {
          background: "transparent",
        },
        ".scrollbar-african::-webkit-scrollbar-thumb": {
          background: "linear-gradient(to bottom, #D4A017, #B8860B)",
          borderRadius: "3px",
        },

        // Glass morphism effect
        ".glass": {
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".glass-dark": {
          background: "rgba(26, 26, 26, 0.7)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },

        // Responsive typography
        ".responsive-text": {
          fontSize: "clamp(1rem, 2vw, 1.5rem)",
        },
        ".responsive-heading": {
          fontSize: "clamp(1.5rem, 4vw, 3rem)",
        },

        // Gradient borders
        ".border-gradient-sun": {
          border: "2px solid transparent",
          background:
            "linear-gradient(white, white) padding-box, linear-gradient(135deg, #D4A017, #B8860B) border-box",
        },
        ".border-gradient-earth": {
          border: "2px solid transparent",
          background:
            "linear-gradient(white, white) padding-box, linear-gradient(135deg, #8B4513, #2C1810) border-box",
        },

        // Text stroke
        ".text-stroke-sun": {
          "-webkit-text-stroke": "1px #D4A017",
          "paint-order": "stroke fill",
        },
        ".text-stroke-earth": {
          "-webkit-text-stroke": "1px #8B4513",
          "paint-order": "stroke fill",
        },

        // Aspect ratio containers
        ".aspect-w-4": {
          position: "relative",
          paddingBottom: "calc(var(--tw-aspect-h) / var(--tw-aspect-w) * 100%)",
        },
        ".aspect-w-4 > *": {
          position: "absolute",
          height: "100%",
          width: "100%",
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },

        // Custom focus styles
        ".focus-african": {
          outline: "none",
          ring: "2px",
          "ring-color": "#D4A017",
          "ring-offset": "2px",
        },

        // Gradient text shadows
        ".text-shadow-sun": {
          "text-shadow": "0 2px 4px rgba(212, 160, 23, 0.3)",
        },
        ".text-shadow-earth": {
          "text-shadow": "0 2px 4px rgba(44, 24, 16, 0.3)",
        },
      };

      addUtilities(newUtilities, ["responsive", "hover", "focus", "dark"]);
    },
  ],
};
