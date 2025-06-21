import express from 'express';
import EarlyAccess from '../models/EarlyAccess.js';
import { validateEmail } from '../middleware/validation.js';
import { rateLimiter, hashIP } from '../middleware/security.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Submit email for early access
router.post('/signup', rateLimiter, validateEmail, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email already exists
    const existingSignup = await EarlyAccess.findOne({ email });
    if (existingSignup) {
      // Don't reveal that the email already exists (security best practice)
      return res.status(200).json({
        success: true,
        message: 'Thank you for your interest!'
      });
    }
    
    // Get IP and hash it for privacy
    const ip = req.ip || req.connection.remoteAddress;
    const ipHash = await hashIP(ip);
    
    // Create new signup
    const signup = new EarlyAccess({
      email,
      ipHash,
      userAgent: req.get('user-agent'),
      metadata: {
        source: req.get('referer') || 'direct',
        campaign: req.query.utm_campaign
      }
    });
    
    await signup.save();
    
    logger.info(`New early access signup: ${email.substring(0, 3)}***`);
    
    res.status(201).json({
      success: true,
      message: 'Successfully signed up for early access!'
    });
    
  } catch (error) {
    logger.error('Signup error:', error);
    
    // Generic error message to avoid information leakage
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

export default router;
