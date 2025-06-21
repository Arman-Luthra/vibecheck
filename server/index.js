import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import { securityMiddleware } from './middleware/security.js';
import earlyAccessRoutes from './routes/earlyAccess.js';
import { logger } from './utils/logger.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
const envPath = path.resolve(__dirname, '..', envFile);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  console.log('Trying default .env loading...');
  dotenv.config(); // Try default loading
}

// Debug: Log to ensure env is loaded
console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('Port:', process.env.PORT || 6005);

const app = express();
const PORT = process.env.PORT || 6005;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security middleware
app.use(mongoSanitize());
app.use(hpp());
app.use(securityMiddleware);

// Routes
app.use('/api/early-access', earlyAccessRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    message
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
