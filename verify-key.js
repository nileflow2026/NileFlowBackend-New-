// verify-key.js
require("dotenv").config();
const { Client, Account } = require("node-appwrite");

console.log("Verifying new API key...");
console.log(
  "Key prefix:",
  process.env.APPWRITE_API_KEY?.substring(0, 20) + "..."
);

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const account = new Account(client);

console.log("\nTesting account.get()...");
account
  .get()
  .then((user) => {
    console.log("✅ SUCCESS!");
    console.log("User ID:", user.$id);
    console.log("Email:", user.email);
    console.log("Name:", user.name);
    console.log("\n✅ API Key has correct scopes!");
  })
  .catch((err) => {
    console.error("❌ FAILED!");
    console.error("Error Code:", err.code);
    console.error("Message:", err.message);
    console.error("\n💡 Solution:");
    console.error("1. Go to Appwrite Console → Settings → API Keys");
    console.error("2. Create new key with ALL scopes checked");
    console.error("3. Update .env file with new key");
  });
