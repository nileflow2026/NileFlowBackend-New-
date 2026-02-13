import React, { useState, useEffect } from "react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollY = window.scrollY;

      // Show button when user scrolls down 200px
      if (scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    toggleVisibility(); // Check initial scroll position

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      onClick={scrollToTop}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "56px",
        height: "56px",
        background:
          "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "20px",
        fontWeight: "bold",
        cursor: "pointer",
        zIndex: 99999,
        boxShadow:
          "0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.1)",
        transition: "all 0.3s ease",
        transform: "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = "scale(1.1) translateY(-2px)";
        e.target.style.boxShadow =
          "0 15px 35px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "scale(1) translateY(0px)";
        e.target.style.boxShadow =
          "0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.1)";
      }}
      aria-label="Scroll to top"
    >
      ↑
    </div>
  );
};

export default ScrollToTopButton;
