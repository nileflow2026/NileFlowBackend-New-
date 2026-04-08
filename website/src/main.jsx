import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Defer non-critical imports
const loadNonCriticalAssets = () => {
  // Load carousel styles asynchronously
  import("slick-carousel/slick/slick.css");
  import("slick-carousel/slick/slick-theme.css");

  // Load FontAwesome asynchronously
  import("@fortawesome/fontawesome-free");

  // Initialize Sentry asynchronously
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: "https://978e357623c4783aad6fbb289f6b5af1@o4509740889079808.ingest.us.sentry.io/4510052105191424",
      sendDefaultPii: true,
      // Reduce performance monitoring sample rate for better performance
      tracesSampleRate: 0.1,
    });
  });
};

// Load non-critical assets after initial render
setTimeout(loadNonCriticalAssets, 100);

// Use concurrent mode for better performance
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
