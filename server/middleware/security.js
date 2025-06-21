import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.js';

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
});

// General security middleware
export const securityMiddleware = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Log suspicious activity
  if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').length > 5) {
    logger.warn(`Suspicious proxy chain detected from IP: ${req.ip}`);
  }
  
  next();
};

// Hash IP for privacy
export const hashIP = async (ip) => {
  const salt = process.env.IP_SALT || 'default-salt-change-this';
  return await bcrypt.hash(ip + salt, 10);
};
