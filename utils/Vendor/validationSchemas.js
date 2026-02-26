// utils/validationSchemas.js
const Joi = require("joi");

const validationSchemas = {
  // Auth Validation
  registerSchema: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters long",
    }),
    storeName: Joi.string().min(2).max(100).required().messages({
      "string.empty": "Store name is required",
      "string.min": "Store name must be at least 2 characters long",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password is required",
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "string.empty": "Please confirm your password",
      }),
    category: Joi.string().required().messages({
      "string.empty": "Category is required",
    }),
    storeDescription: Joi.string().min(20).max(1000).required().messages({
      "string.empty": "Store description is required",
      "string.min": "Store description must be at least 20 characters",
    }),
    location: Joi.string().allow("").optional().messages({
      "string.empty": "Location is optional",
    }),
  }),

  loginSchema: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  }),

  // Product Validation
  createProductSchema: Joi.object({
    name: Joi.string().min(2).max(200).required().messages({
      "string.empty": "Product name is required",
      "string.min": "Product name must be at least 2 characters long",
    }),
    description: Joi.string().min(10).max(2000).required().messages({
      "string.empty": "Product description is required",
      "string.min": "Description must be at least 10 characters long",
    }),
    price: Joi.number().min(0.01).required().messages({
      "number.min": "Price must be greater than 0",
      "number.base": "Price must be a valid number",
    }),
    category: Joi.string().required().messages({
      "string.empty": "Category is required",
    }),
    tags: Joi.array().items(Joi.string()).default([]),
    inventory: Joi.number().integer().min(0).default(0),
    attributes: Joi.object().default({}),
    image: Joi.string().uri().allow(""), // Add this line
    images: Joi.array().items(Joi.string().uri()), // Add this line
  }),

  updateProductSchema: Joi.object({
    name: Joi.string().min(2).max(200),
    description: Joi.string().min(10).max(2000),
    price: Joi.number().min(0.01),
    category: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    inventory: Joi.number().integer().min(0),
    attributes: Joi.object(),
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    image: Joi.string().uri().allow(""), // Add this line
    images: Joi.array().items(Joi.string().uri()), // Add this line
  }),

  // Vendor Profile Validation
  updateProfileSchema: Joi.object({
    name: Joi.string().min(2).max(100),
    storeName: Joi.string().min(2).max(100),
    storeDescription: Joi.string().max(1000),
    socialLinks: Joi.object({
      website: Joi.string().uri().allow(""),
      facebook: Joi.string().uri().allow(""),
      instagram: Joi.string().uri().allow(""),
      twitter: Joi.string().uri().allow(""),
    }),
  }),

  // Order Validation
  updateOrderSchema: Joi.object({
    status: Joi.string()
      .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
      .required(),
    trackingNumber: Joi.string().allow(""),
    notes: Joi.string().max(500).allow(""),
  }),
};

module.exports = { validationSchemas };
