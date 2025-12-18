// utils/helpers.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { env } = require('../../src/env');
 
// Generate JWT Token
const generateToken = (vendorId) => {
    return jwt.sign(
        { id: vendorId },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );
};

// Generate random password for social logins
const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

// Format currency for African markets
const formatCurrency = (amount, currency = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    });
    return formatter.format(amount);
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Sanitize input data
const sanitizeInput = (data) => {
    if (typeof data === 'string') {
        return data.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return data;
};

// Generate unique SKU for products
const generateSKU = (vendorId, productName) => {
    const timestamp = Date.now().toString(36);
    const vendorCode = vendorId.slice(-4).toUpperCase();
    const productCode = productName.slice(0, 3).toUpperCase().replace(/\s/g, '');
    return `NM${vendorCode}${productCode}${timestamp}`;
};

// Calculate vendor rating
const calculateVendorRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
};

module.exports = {
    generateToken,
    generateRandomPassword,
    formatCurrency,
    isValidEmail,
    sanitizeInput,
    generateSKU,
    calculateVendorRating
};