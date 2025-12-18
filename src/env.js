const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().default(3000),
  APPWRITE_ENDPOINT: Joi.string().uri().required(),
  APPWRITE_PROJECT_ID: Joi.string().required(),
  APPWRITE_API_KEY: Joi.string().required(),
}).unknown();

const env = schema.validate(process.env, { stripUnknown: true }).value;
module.exports = { env };
