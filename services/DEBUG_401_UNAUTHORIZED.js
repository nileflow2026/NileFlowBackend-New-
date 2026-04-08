// TEST: How to fix 401 Unauthorized for subscription endpoints

/**
 * DEBUGGING GUIDE FOR 401 UNAUTHORIZED ERROR
 * ==========================================
 */

// ISSUE: GET http://localhost:3000/api/subscription/status returns 401

// CAUSES & SOLUTIONS:
// ===================

/**
 * 1. FRONTEND NOT SENDING CREDENTIALS
 * ------------------------------------
 * Problem: Cookies not being sent with the request
 *
 * Solution - Add credentials to your fetch/axios request:
 */

// FETCH API:
fetch("http://localhost:3000/api/subscription/status", {
  method: "GET",
  credentials: "include", // ⬅️ THIS IS CRITICAL!
  headers: {
    "Content-Type": "application/json",
  },
});

// AXIOS:
axios.get("http://localhost:3000/api/subscription/status", {
  withCredentials: true, // ⬅️ THIS IS CRITICAL!
});

// AXIOS GLOBAL CONFIG (set once):
axios.defaults.withCredentials = true;

/**
 * 2. USER NOT LOGGED IN / NO ACCESS TOKEN
 * ----------------------------------------
 * Problem: No accessToken cookie exists
 *
 * Solution - Ensure user is logged in first:
 */

// Check if user is logged in before making the request
const checkAuth = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/customerauth/me", {
      credentials: "include",
    });
    if (response.ok) {
      // User is authenticated, now fetch subscription
      fetchSubscriptionStatus();
    } else {
      // Redirect to login
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("Auth check failed:", error);
  }
};

/**
 * 3. CORS CONFIGURATION ISSUE
 * ----------------------------
 * Problem: Browser blocking cookies due to CORS
 *
 * Solution - Verify backend CORS config (already configured in index.js):
 */

// Your backend should have (already in src/index.js):
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true, // ⬅️ THIS IS CRITICAL!
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

/**
 * 4. TESTING WITHOUT LOGIN
 * -------------------------
 * If you want to test the endpoint without frontend login:
 */

// Option A: Use cURL with a valid token
/*
1. Login via your frontend and get the accessToken cookie
2. Open browser DevTools > Application > Cookies
3. Copy the accessToken value
4. Use in cURL:

curl -X GET http://localhost:3000/api/subscription/status \
  -H "Cookie: accessToken=YOUR_TOKEN_HERE"
*/

// Option B: Temporarily bypass auth for testing (NOT FOR PRODUCTION!)
// Comment out the authMiddleware line in subscriptionRoutes.js:
// router.use(authMiddleware); // ⬅️ Comment this temporarily

/**
 * 5. COMPLETE WORKING EXAMPLE (REACT)
 * ------------------------------------
 */

// SubscriptionStatus.jsx
import { useState, useEffect } from "react";
import axios from "axios";

// Configure axios to always send credentials
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:3000";

function SubscriptionStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get("/api/subscription/status");
        setStatus(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please login to view subscription status");
          // Redirect to login
          window.location.href = "/login";
        } else {
          setError(err.response?.data?.error || "Failed to fetch status");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Subscription Status</h2>
      <p>Premium: {status?.isPremium ? "Yes" : "No"}</p>
      {status?.expiresAt && (
        <p>Expires: {new Date(status.expiresAt).toLocaleDateString()}</p>
      )}
    </div>
  );
}

export default SubscriptionStatus;

/**
 * 6. DEBUGGING STEPS
 * ------------------
 */

// Step 1: Check if cookies are being sent
// Open browser DevTools > Network > Select the request > Headers
// Look for "Cookie: accessToken=..." in Request Headers

// Step 2: Enable auth middleware logging
// Uncomment the console.log lines in middleware/authMiddleware.js (lines 5-9, 11-17, 21-24)

// Step 3: Check backend logs
// Look for "❌ ERROR: No access token in cookies" in your terminal

// Step 4: Verify login is working
// After login, check browser cookies (DevTools > Application > Cookies)
// Should see "accessToken" cookie with a value

// Step 5: Test with a simple endpoint first
// Try a different authenticated endpoint to verify auth is working:
axios
  .get("/api/customerprofile/me", { withCredentials: true })
  .then((response) => console.log("Auth works!", response.data))
  .catch((error) => console.error("Auth failed!", error));

/**
 * 7. COMMON MISTAKES TO AVOID
 * ----------------------------
 */

// ❌ WRONG - Missing credentials
fetch("http://localhost:3000/api/subscription/status");

// ✅ CORRECT - With credentials
fetch("http://localhost:3000/api/subscription/status", {
  credentials: "include",
});

// ❌ WRONG - Axios without credentials
axios.get("/api/subscription/status");

// ✅ CORRECT - Axios with credentials
axios.get("/api/subscription/status", { withCredentials: true });

// ❌ WRONG - Different domain without CORS config
// Frontend: http://localhost:3000
// Backend: http://localhost:5000
// Solution: Update CORS origin in backend to include http://localhost:3000

/**
 * 8. QUICK FIX CHECKLIST
 * -----------------------
 */

const troubleshootingChecklist = {
  frontend: [
    "[ ] Add credentials: true or withCredentials: true to requests",
    "[ ] Verify user is logged in before making request",
    "[ ] Check browser DevTools > Network > Request Headers for Cookie",
    "[ ] Verify frontend URL matches CORS config in backend",
  ],
  backend: [
    "[ ] Verify CORS credentials: true is set in src/index.js",
    "[ ] Verify frontend URL is in allowedOrigins array",
    "[ ] Enable auth middleware logging to see what's failing",
    "[ ] Check if accessToken cookie is being received",
  ],
  testing: [
    "[ ] Login via frontend first",
    "[ ] Check browser cookies for accessToken",
    "[ ] Test subscription endpoint",
    "[ ] Check backend terminal for error messages",
  ],
};

/**
 * 9. TEMPORARY DEBUG VERSION (Use if still stuck)
 * -----------------------------------------------
 */

// Add this temporary route to help debug:
// In routes/subscriptionRoutes.js, add BEFORE router.use(authMiddleware):

router.get("/debug", (req, res) => {
  res.json({
    cookies: req.cookies,
    hasAccessToken: !!req.cookies?.accessToken,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
    },
    message: "If you see accessToken here, auth should work",
  });
});

// Then test: http://localhost:3000/api/subscription/debug

/**
 * 10. MOST LIKELY SOLUTION
 * -------------------------
 * Based on the 401 error, you most likely need to:
 */

// In your frontend API calls, ADD THIS:
const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // ⬅️ ADD THIS LINE
});

// Then use:
api
  .get("/api/subscription/status")
  .then((response) => console.log(response.data))
  .catch((error) => console.error(error));

// OR if using fetch:
fetch("http://localhost:3000/api/subscription/status", {
  credentials: "include", // ⬅️ ADD THIS LINE
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));

module.exports = {
  troubleshootingChecklist,
  // Export for reference
};
