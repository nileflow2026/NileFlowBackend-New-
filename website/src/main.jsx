import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "@fortawesome/fontawesome-free";

/* ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); */

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://978e357623c4783aad6fbb289f6b5af1@o4509740889079808.ingest.us.sentry.io/4510052105191424",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Optional: For performance monitoring, set a sample rate
  // tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
