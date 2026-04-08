// API proxy to handle backend calls
// This assumes your backend is running on a different port (like 3001)

export default async function handler(req, res) {
  const { method } = req;
  const { path } = req.query; // This will capture the rest of the path

  // Build the full path
  const apiPath = Array.isArray(path) ? path.join("/") : path;

  // Your backend URL - adjust port as needed
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
  const url = `${backendUrl}/api/${apiPath}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...req.headers,
      },
      body: method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    // Forward the status code and data
    res.status(response.status).json(data);
  } catch (error) {
    console.error("API Proxy Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
