const jwt = require('jsonwebtoken');
const { env } = require('../../src/env');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.substring(7); // Remove "Bearer " prefix

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, env.JWT_SECRET);
        
        // Add vendor ID to request
        req.vendorId = decoded.vendorId;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired.'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Authentication failed.'
        });
    }
};

module.exports = authMiddleware;