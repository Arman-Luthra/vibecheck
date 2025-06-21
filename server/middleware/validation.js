import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Invalid email format')
    .custom((value) => {
      // Additional validation for common typos
      const suspiciousPatterns = [
        /(.)\1{4,}/, // Repeated characters
        /test@test/, // Test emails
        /^[^@]+@[^.]+$/, // Missing TLD
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          throw new Error('Invalid email format');
        }
      }
      return true;
    }),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Validation failed for email: ${req.body.email}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    next();
  }
];
