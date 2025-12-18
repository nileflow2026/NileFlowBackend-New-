// redisClient.js
const IORedis = require("ioredis");

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("❌ REDIS_URL is not defined in environment variables.");
}

const redis = new IORedis(redisUrl, {
  // Retry strategy: exponential backoff, max 10s
  retryStrategy(times) {
    const delay = Math.min(times * 200, 10000);
    console.warn(
      `⚠️ Redis reconnect attempt #${times}, retrying in ${delay}ms`
    );
    return delay;
  },
  maxRetriesPerRequest: null, // Prevents MaxRetriesPerRequestError crash
  enableReadyCheck: true,
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
});

// --- Connection event logging ---
redis.on("connect", () => console.log("🔌 Redis: connecting..."));
redis.on("ready", () => console.log("✅ Redis: ready for commands"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));
redis.on("end", () => console.log("🚪 Redis connection closed"));
redis.on("reconnecting", (time) =>
  console.log(`🔄 Redis: reconnecting in ${time}ms`)
);

const setVerificationCode = async (email, code, ttlSeconds = 900) => {
  const key = `verify:${email}`;
  await redis.set(key, code, "EX", ttlSeconds);
};

const getAndDeleteVerificationCode = async (email) => {
  const key = `verify:${email}`;
  const script = `
    local v = redis.call("GET", KEYS[1])
    if v then redis.call("DEL", KEYS[1]) end
    return v
  `;
  return await redis.eval(script, 1, key);
};

const storeRefreshToken = async (userId, refreshToken, ttlSeconds) => {
  const key = `refresh:${userId}:${refreshToken}`; // make refresh token searchable
  await redis.set(key, "1", "EX", ttlSeconds);
};

const revokeRefreshToken = async (userId, refreshToken) => {
  const key = `refresh:${userId}:${refreshToken}`;
  return await redis.del(key);
};

const checkRefreshTokenExists = async (userId, refreshToken) => {
  const key = `refresh:${userId}:${refreshToken}`;
  const v = await redis.get(key);
  return !!v;
};

module.exports = {
  redis,
  setVerificationCode,
  getAndDeleteVerificationCode,
  storeRefreshToken,
  revokeRefreshToken,
  checkRefreshTokenExists,
};
