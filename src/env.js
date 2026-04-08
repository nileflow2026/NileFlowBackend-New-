const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  APPWRITE_ENDPOINT: Joi.string().uri().required(),
  APPWRITE_PROJECT_ID: Joi.string().required(),
  APPWRITE_API_KEY: Joi.string().required(),
  APPWRITE_DATABASE_ID: Joi.string().required(),
  APPWRITE_USER_COLLECTION_ID: Joi.string().required(),
  APPWRITE_ORDERS_COLLECTION: Joi.string().required(),
  APPWRITE_NOTIFICATIONS_COLLECTION_ID: Joi.string().required(),
  APPWRITE_CART_COLLECTION_ID: Joi.string().required(),
  APPWRITE_CANCELLED_ORDERS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_CANCELLATION_REQUESTS_COLLECTION_ID: Joi.string().optional(),
  // Platform Settings & Commission System
  APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID: Joi.string().required(),
  APPWRITE_FINANCIAL_REPORTS_COLLECTION_ID: Joi.string()
    .optional()
    .default("6971de010027c73e75a9"),
  APPWRITE_AUDIT_LOGS_COLLECTION_ID: Joi.string().optional(),
  // Subscriptions Collection
  APPWRITE_SUBSCRIPTIONS_COLLECTION_ID: Joi.string().optional(),
  // Products Collection
  APPWRITE_PRODUCT_COLLECTION_ID: Joi.string().optional(),
  // Categories Collection
  APPWRITE_CATEGORIES_COLLECTION_ID: Joi.string().optional(),
  // African Facts & Proverbs Collections
  AFRICAN_FACTS_COLLECTION_ID: Joi.string().optional(),
  AFRICAN_PROVERBS_COLLECTION_ID: Joi.string().optional(),
  // Recommendation System Collections
  EXPLORATION_PATTERNS_COLLECTION_ID: Joi.string().optional(),
  USER_SESSIONS_COLLECTION_ID: Joi.string().optional(),
  RECOMMENDATION_FEEDBACK_COLLECTION_ID: Joi.string().optional(),
  CONTEXT_PROFILES_COLLECTION_ID: Joi.string().optional(),
  RECOMMENDATION_WEIGHTS_COLLECTION_ID: Joi.string().optional(),
  ITEM_SOCIAL_SIGNALS_COLLECTION_ID: Joi.string().optional(),
  BUSINESS_METRICS_COLLECTION_ID: Joi.string().optional(),
  // Refresh tokens collection used by auth controllers
  APPWRITE_REFRESH_TOKEN_COLLECTION_ID: Joi.string().required(),
  // Vendor Payout System Collections
  APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID: Joi.string().required(),
  APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID: Joi.string().required(),
  APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID: Joi.string().required(),
  // Frontend URL used for OAuth final redirect
  FRONTEND_URL: Joi.string().uri().default("http://localhost:5173"),
  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_REDIRECT_URI: Joi.string().uri().optional(),
  // Facebook OAuth
  FACEBOOK_APP_ID: Joi.string().optional(),
  FACEBOOK_APP_SECRET: Joi.string().optional(),
  FACEBOOK_REDIRECT_URI: Joi.string().uri().optional(),
  // M-Pesa Daraja API
  MPESA_CONSUMER_KEY: Joi.string().optional(),
  MPESA_CONSUMER_SECRET: Joi.string().optional(),
  MPESA_SHORTCODE: Joi.string().optional(),
  MPESA_PASSKEY: Joi.string().optional(),
  MPESA_ENVIRONMENT: Joi.string()
    .valid("sandbox", "production")
    .default("sandbox"),
  MPESA_CALLBACK_URL: Joi.string().uri().optional(),
  BACKEND_URL: Joi.string().uri().optional(),
  // PayPal API
  PAYPAL_CLIENT_ID: Joi.string().optional(),
  PAYPAL_CLIENT_SECRET: Joi.string().optional(),
  PAYPAL_MODE: Joi.string().valid("sandbox", "production").default("sandbox"),
  // Stripe API
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  // OpenAI API
  OPENAI_API_KEY: Joi.string().optional(),
}).unknown();

const env = schema.validate(process.env, { stripUnknown: true }).value;
module.exports = { env };
