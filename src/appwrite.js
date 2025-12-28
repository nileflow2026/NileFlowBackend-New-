const {
  Client,
  Account,
  Databases,
  Users,
  Functions,
  Storage,
  ID,
} = require("node-appwrite");
const { env } = require("./env");
const { Avatars } = require("node-appwrite");
console.log(
  "Appwrite Key Loaded:",
  env.APPWRITE_API_KEY ? "Loaded" : "FAILED/UNDEFINED"
); // 👈 Check this!
const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

console.log("Appwrite Endpoint:", env.APPWRITE_ENDPOINT);
console.log("Appwrite Project ID:", env.APPWRITE_PROJECT_ID);
console.log("Appwrite API Key:", env.APPWRITE_API_KEY ? "Loaded" : "Error");

module.exports.account = new Account(client);
module.exports.db = new Databases(client);
module.exports.users = new Users(client);
module.exports.avatars = new Avatars(client);
module.exports.functions = new Functions(client);
module.exports.storage = new Storage(client);
module.exports.ID = ID;
