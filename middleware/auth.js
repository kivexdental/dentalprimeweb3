const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dental_crm_jwt_key_2026_x987';

const CRM_MCP_API_KEY = process.env.CRM_MCP_API_KEY || 'dental_crm_antigravity_mcp_secret_2026';

const authenticateToken = (req, res, next) => {
  // Check for internal API key (used by MCP server & Antigravity agents)
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === CRM_MCP_API_KEY) {
    req.user = { id: 1, email: 'system@antigravity.ai', role: 'admin' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }
  // Admin, doctor, and staff all have full access to every section of the CRM
  next();
};

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
