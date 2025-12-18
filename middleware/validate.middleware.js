// middleware/validate.middleware.js
const Joi = require("joi");

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().min(3).max(30).required(),
  phone: Joi.string().pattern(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/),
  referralCode: Joi.string().max(20),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    next();
  };
};

module.exports = {
  validateSignup: validate(signupSchema),
  validateLogin: validate(loginSchema),
};
