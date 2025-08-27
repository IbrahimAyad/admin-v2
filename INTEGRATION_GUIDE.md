# KCT Menswear Backend v2 - Complete Integration Guide

## Overview

This is a comprehensive, production-ready Medusa.js e-commerce backend with complete integrations for:

- **Payment Processing**: Stripe with webhook support
- **File Storage**: Cloudflare R2 (with local fallback)
- **Shipping**: EasyPost API integration
- **Email Service**: Resend transactional emails
- **Authentication**: Google OAuth & Facebook/Meta OAuth
- **Database**: PostgreSQL with Redis caching
- **Deployment**: Railway cloud platform

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd kct-menswear-backend-v2
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Database Setup
```bash
npm run kct:setup  # Run migrations and seed
```

### 4. Start Development
```bash
npm run dev  # Development with hot reload
# or
npm start   # Production mode
```

### 5. Access Points
- **Admin Dashboard**: `http://localhost:9000/admin`
- **Store API**: `http://localhost:9000/store`
- **Health Check**: `http://localhost:9000/health`

**Admin Credentials**:
- Email: `admin@kctmenswear.com`
- Password: `KCTAdmin2024!`

## 🔧 Complete Integration Setup

### 1. Stripe Payment Processing

**Required Environment Variables**:
```bash
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Setup Steps**:
1. Create [Stripe Account](https://dashboard.stripe.com/register)
2. Get API keys from Dashboard > Developers > API keys
3. Set up webhooks pointing to `https://your-domain.com/stripe/webhook`
4. Test with: `POST /stripe/create-payment-intent`

**Features Implemented**:
- Payment intent creation and processing
- Webhook handling for payment events
- End-to-end payment flow integration
- Test endpoints for payment verification

### 2. Cloudflare R2 File Storage

**Required Environment Variables**:
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_BUCKET=kct-menswear-uploads
CLOUDFLARE_PUBLIC_URL=https://your-bucket.your-account-id.r2.cloudflarestorage.com
```

**Setup Steps**:
1. Create [Cloudflare Account](https://dash.cloudflare.com/sign-up)
2. Go to R2 Object Storage
3. Create R2 bucket
4. Generate R2 API tokens
5. Configure bucket policies for public access

**Features Implemented**:
- File upload and storage
- Public and protected file access
- Presigned URLs for secure downloads
- Automatic fallback to local storage

### 3. EasyPost Shipping Integration

**Required Environment Variables**:
```bash
EASYPOST_API_KEY=EZAK...
```

**Setup Steps**:
1. Create [EasyPost Account](https://www.easypost.com/signup)
2. Get API key from Dashboard
3. Configure shipping address in `src/services/shipping.ts`

**Features Implemented**:
- Real-time shipping rate calculations
- Label generation and tracking
- Multiple carrier support (USPS, FedEx, UPS)
- Automatic fallback to standard rates

### 4. Resend Email Service

**Required Environment Variables**:
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Setup Steps**:
1. Create [Resend Account](https://resend.com/signup)
2. Add and verify your domain
3. Generate API key
4. Configure SPF/DKIM records

**Features Implemented**:
- Order confirmation emails
- Shipping notification emails
- Welcome emails for new customers
- Password reset emails
- Beautiful HTML email templates

### 5. Google OAuth Integration

**Required Environment Variables**:
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Setup Steps**:
1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs

**Features Implemented**:
- Google Sign-In for customers
- Automatic customer account creation
- JWT token generation
- User profile data extraction

### 6. Facebook/Meta OAuth Integration

**Required Environment Variables**:
```bash
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

**Setup Steps**:
1. Create app in [Facebook Developers](https://developers.facebook.com)
2. Add Facebook Login product
3. Configure Valid OAuth Redirect URIs
4. Get App ID and App Secret

**Features Implemented**:
- Facebook Login for customers
- User profile and email access
- Account linking and creation
- Secure token validation

## 📊 API Endpoints

### Core Endpoints
```bash
# Health and Status
GET  /health                    # Health check

# Store API (Public)
GET  /store/products            # List products
GET  /store/products/:id       # Product details
GET  /store/regions            # Available regions
GET  /store/collections        # Product collections
GET  /store/product-categories # Product categories

# Admin API (Protected)
POST /admin/auth               # Admin login
GET  /admin/products           # Admin product list
POST /admin/products           # Create product
PUT  /admin/products/:id       # Update product
```

### Integration Endpoints
```bash
# Stripe Payments
POST /stripe/create-payment-intent  # Create payment
POST /stripe/verify-payment         # Verify payment
POST /stripe/webhook                # Stripe webhooks

# OAuth Authentication
POST /auth/google                    # Google OAuth login
POST /auth/facebook                  # Facebook OAuth login
```

## 🧪 Testing & Verification

### Run Complete Integration Test
```bash
# Test all integrations
BACKEND_URL="http://localhost:9000" node scripts/complete-integration-test.js

# Test on deployed Railway instance
BACKEND_URL="https://your-app.railway.app" node scripts/complete-integration-test.js
```

### Individual Service Testing
```bash
# Test basic functionality
node scripts/verify-deployment.js

# Test Stripe payment flow
curl -X POST http://localhost:9000/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 2999, "currency": "usd"}'

# Test product catalog
curl http://localhost:9000/store/products | jq
```

## 🚂 Railway Deployment

### Environment Variables for Production

**Core Variables**:
```bash
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
COOKIE_SECRET=your-production-cookie-secret
SESSION_SECRET=your-production-session-secret
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
```

**CORS Configuration**:
```bash
STORE_CORS=https://kctmenswear.com,https://www.kctmenswear.com
ADMIN_CORS=https://admin.kctmenswear.com,https://your-app.railway.app
```

**Integration Credentials**:
```bash
# All the integration environment variables from above
```

### Deployment Steps

1. **Push to GitHub**:
```bash
git add .
git commit -m "Production-ready Medusa v2 with complete integrations"
git push origin main
```

2. **Railway Configuration**:
- Connect GitHub repository
- Add PostgreSQL service
- Add Redis service
- Set all environment variables
- Deploy automatically triggers

3. **Post-Deployment Verification**:
```bash
# Run complete integration test
BACKEND_URL="https://your-app.railway.app" node scripts/complete-integration-test.js
```

## 🔄 Service Architecture

### Custom Services Implemented

**ShippingService** (`src/services/shipping.ts`):
- EasyPost integration
- Rate calculations
- Label generation
- Package tracking

**EmailService** (`src/services/email.ts`):
- Resend integration
- Template-based emails
- Event-driven notifications
- Error handling

**CloudflareR2Service** (`src/services/file.ts`):
- S3-compatible storage
- Public/private file access
- Presigned URLs
- Stream uploads

**OrderSubscriber** (`src/subscribers/order.ts`):
- Automatic email notifications
- Order lifecycle events
- Customer communication

### Event Flow

1. **Order Placed** → Send confirmation email
2. **Order Shipped** → Send tracking email
3. **Customer Created** → Send welcome email
4. **Payment Succeeded** → Process order

## 🛠 Development Commands

```bash
# Development
npm run dev              # Start with hot reload
npm run kct:dev         # Setup + development

# Database
npm run migration:run    # Run migrations
npm run migration:generate <name>  # Create migration
npm run seed            # Seed database
npm run kct:setup       # Full setup (migrate + seed)
npm run kct:reset       # Reset database

# Production
npm run build           # Build for production
npm start              # Start production server

# Testing
npm test               # Run test suite
node scripts/complete-integration-test.js  # Integration tests
```

## 🐛 Troubleshooting

### Common Issues

**Service Not Configured**:
- Check environment variables
- Verify service files exist
- Run integration test

**Payment Issues**:
- Verify Stripe API keys
- Check webhook configuration
- Test with small amounts first

**Email Not Sending**:
- Verify Resend domain setup
- Check SPF/DKIM records
- Test with simple email first

**File Upload Issues**:
- Check Cloudflare R2 configuration
- Verify bucket permissions
- Test local storage fallback

**OAuth Not Working**:
- Check redirect URIs
- Verify app configurations
- Test with correct scopes

### Debug Commands
```bash
# Check service status
node scripts/complete-integration-test.js

# Test specific integration
curl -X POST http://localhost:9000/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# View logs
tail -f logs/medusa.log
```

## 📈 Performance Optimization

### Redis Caching
- Session storage
- Product cache
- Rate limiting

### Database Optimization
- Proper indexing
- Connection pooling
- Query optimization

### File Storage
- CDN integration
- Image optimization
- Caching headers

## 🔒 Security Features

- JWT authentication
- CORS protection
- Rate limiting
- Input validation
- Webhook verification
- Environment variable security

## 📚 Additional Resources

- [Medusa.js Documentation](https://docs.medusajs.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [EasyPost API Documentation](https://www.easypost.com/docs/api)
- [Resend Documentation](https://resend.com/docs)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [Railway Documentation](https://docs.railway.app)

## 💡 Next Steps

1. **Configure All Integrations**: Set up all environment variables
2. **Test Thoroughly**: Run complete integration tests
3. **Deploy to Railway**: Push to production
4. **Monitor Performance**: Set up monitoring and alerts
5. **Scale as Needed**: Add additional services and features

This backend is now fully production-ready with all major e-commerce integrations implemented and tested.
