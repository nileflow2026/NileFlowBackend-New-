// debug-crash.js
console.log("🔍 Debugging server crash...\n");

// 1. Check environment
console.log("1. Checking environment variables:");
console.log("   APPWRITE_ENDPOINT:", env.APPWRITE_ENDPOINT);
console.log("   APPWRITE_PROJECT_ID:", env.APPWRITE_PROJECT_ID);
console.log("   APPWRITE_API_KEY exists:", !!env.APPWRITE_API_KEY);
console.log("   APPWRITE_API_KEY length:", env.APPWRITE_API_KEY?.length);
console.log(
  "   APPWRITE_API_KEY first chars:",
  env.APPWRITE_API_KEY?.substring(0, 20)
);
console.log("");

// 2. Try to require modules
console.log("2. Testing module imports:");
try {
  const express = require("express");
  console.log("   ✅ express: OK");
} catch (e) {
  console.log("   ❌ express:", e.message);
}

try {
  const { Client } = require("node-appwrite");
  console.log("   ✅ node-appwrite: OK");
} catch (e) {
  console.log("   ❌ node-appwrite:", e.message);
}

// 3. Test Appwrite connection directly
console.log("\n3. Testing Appwrite connection directly:");
const { Client, Account } = require("node-appwrite");
const { env } = require("./src/env");

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const account = new Account(client);

account
  .get()
  .then((user) => {
    console.log("   ✅ Appwrite connection successful!");
    console.log("   User:", user.email);
    process.exit(0);
  })
  .catch((error) => {
    console.log("   ❌ Appwrite connection failed:");
    console.log("   Code:", error.code);
    console.log("   Message:", error.message);

    if (error.response) {
      console.log("   Response:", error.response);
    }
    process.exit(1);
  });
