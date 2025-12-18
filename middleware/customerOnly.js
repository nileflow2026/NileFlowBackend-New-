// middleware/customerOnly.js
const customerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
      return next();
    }
  
    return res.status(403).json({ error: 'Access denied. Customers only.' });
  };
  
  module.exports = customerOnly;
  