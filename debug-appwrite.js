// debug-appwrite.js
require("dotenv").config();

console.log("Environment Variables:");
console.log("- APPWRITE_ENDPOINT:", process.env.APPWRITE_ENDPOINT);
console.log("- APPWRITE_PROJECT_ID:", process.env.APPWRITE_PROJECT_ID);
console.log("- APPWRITE_API_KEY exists:", !!process.env.APPWRITE_API_KEY);
console.log("- NODE_ENV:", process.env.NODE_ENV);

// Test Appwrite directly
const { Client, Account } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const account = new Account(client);

console.log("\nTesting Appwrite connection...");
account
  .get()
  .then((user) => console.log("✅ Success! User:", user.email))
  .catch((err) => {
    console.error("❌ Failed!");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    console.error("Type:", err.type);
    console.error("Response:", err.response);
  });
