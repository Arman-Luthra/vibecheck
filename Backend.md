# VibeCheck Backend API

Secure email collection API for cybersecurity audit service.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your MongoDB credentials

# Run development server
npm run server:dev
```

## Environment Variables

Create `.env.local`:

```env
NODE_ENV=development
PORT=6005
MONGODB_URI=mongodb://localhost:27017/vibecheck
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
IP_SALT=random-salt-string-here
```

## API Endpoints

### POST `/api/early-access/signup`
Submit email for early access.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully signed up for early access!"
}
```

### GET `/api/early-access/health`
Health check endpoint.

## Security Features

- **Rate Limiting**: 5 requests per 15 minutes per IP
- **Input Validation**: RFC 5322 compliant email validation  
- **Data Protection**: Hashed IPs, encrypted emails
- **NoSQL Injection Prevention**: MongoDB sanitization
- **Security Headers**: Helmet.js, CORS, CSP
- **Audit Logging**: Winston logger for security events

## Project Structure

```
server/
├── index.js           # Express server setup
├── config/
│   └── database.js    # MongoDB connection
├── models/
│   └── EarlyAccess.js # Email signup model
├── routes/
│   └── earlyAccess.js # API routes
├── middleware/
│   ├── security.js    # Rate limiting, IP hashing
│   └── validation.js  # Input validation
└── utils/
    └── logger.js      # Winston logger
```

## Development

```bash
# Run with nodemon
npm run server:dev

# Test endpoint
curl -X POST http://localhost:6005/api/early-access/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use MongoDB Atlas with IP whitelist
3. Enable HTTPS (required)
4. Update CORS origin
5. Generate secure `IP_SALT`
6. Set up monitoring & backups


