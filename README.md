# KCT Menswear Backend v2

A complete, production-ready Medusa.js e-commerce backend for KCT Menswear with comprehensive integrations for payments, shipping, email, file storage, and social authentication.

## 🎆 Complete Feature Set

### Core E-commerce
- **Modern Medusa.js Backend**: Latest v1.20.6 with TypeScript
- **Admin Dashboard**: Beautiful, responsive admin interface
- **RESTful APIs**: Complete Store and Admin APIs
- **Product Catalog**: Full product, variant, and inventory management
- **Order Processing**: Complete order lifecycle management
- **Customer Management**: Registration, profiles, and authentication

### Payment Processing
- **Stripe Integration**: Secure payment processing with webhooks
- **Payment Testing**: Built-in payment flow testing endpoints
- **Multiple Currencies**: USD support with extensible currency system
- **Webhook Handling**: Real-time payment event processing

### File Storage & CDN
- **Cloudflare R2**: Production-ready cloud storage
- **Local Fallback**: Automatic fallback to local storage
- **Public/Private Files**: Secure file access control
- **Presigned URLs**: Secure temporary file access
- **Image Optimization**: Optimized for e-commerce product images

### Shipping & Fulfillment
- **EasyPost Integration**: Real-time shipping rates from multiple carriers
- **Label Generation**: Automatic shipping label creation
- **Package Tracking**: Real-time shipment tracking
- **Multi-Carrier Support**: USPS, FedEx, UPS integration
- **Fallback Rates**: Default shipping options when API unavailable

### Email Communications
- **Resend Integration**: Professional transactional emails
- **Order Confirmations**: Automatic order confirmation emails
- **Shipping Notifications**: Tracking information emails
- **Welcome Emails**: Customer onboarding emails
- **HTML Templates**: Beautiful, responsive email designs
- **Password Reset**: Secure password recovery emails

### Social Authentication
- **Google OAuth**: Sign in with Google integration
- **Facebook Login**: Facebook/Meta authentication
- **JWT Tokens**: Secure authentication token management
- **Account Linking**: Seamless social account integration

### Production Infrastructure
- **PostgreSQL Database**: Robust relational database with migrations
- **Redis Caching**: High-performance caching and sessions
- **Railway Deployment**: Cloud-native deployment configuration
- **Docker Support**: Containerized deployment ready
- **Health Monitoring**: Built-in health checks and status endpoints
- **Comprehensive Logging**: Production-grade logging and monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server (optional, falls back to in-memory)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd kct-menswear-backend-v2

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database and seed data
npm run kct:setup

# Start development server
npm run dev
```

### Access Points
- **Admin Dashboard**: http://localhost:9000/admin
- **Store API**: http://localhost:9000/store
- **Health Check**: http://localhost:9000/health
- **API Documentation**: http://localhost:9000/docs

### Default Admin Credentials
- **Email**: admin@kctmenswear.com
- **Password**: KCTAdmin2024!

## 🔧 Integration Configuration

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for complete setup instructions.

### Required Environment Variables

**Core Configuration**:
```bash
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
SESSION_SECRET=your-session-secret
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port  # Optional
```

**Payment Processing** (Stripe):
```bash
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**File Storage** (Cloudflare R2):
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET=kct-menswear-uploads
```

**Shipping** (EasyPost):
```bash
EASYPOST_API_KEY=EZAK...
```

**Email** (Resend):
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@kctmenswear.com
```

**OAuth** (Google & Facebook):
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

## 📊 API Endpoints

### Store API (Public)
```bash
GET    /store/products              # List products
GET    /store/products/:id         # Product details
GET    /store/regions              # Available regions
GET    /store/collections          # Product collections
POST   /store/carts                # Create cart
POST   /store/carts/:id/line-items # Add to cart
POST   /store/carts/:id/complete   # Checkout
```

### Admin API (Protected)
```bash
POST   /admin/auth        # Admin login
GET    /admin/products    # Admin product management
POST   /admin/products    # Create product
PUT    /admin/products/:id # Update product
GET    /admin/orders      # Order management
GET    /admin/customers   # Customer management
```

### Integration APIs
```bash
# Stripe Payments
POST   /stripe/create-payment-intent # Create payment
POST   /stripe/verify-payment        # Verify payment
POST   /stripe/webhook              # Payment webhooks

# OAuth Authentication
POST   /auth/google                 # Google OAuth
POST   /auth/facebook              # Facebook OAuth

# Health & Status
GET    /health                     # Service health
```

## 🧪 Testing & Verification

### Comprehensive Integration Testing
```bash
# Test all integrations
npm run kct:test-all

# Test basic functionality
npm run kct:verify

# Test specific integrations
npm run kct:test-stripe    # Test payment processing
npm run kct:test-products  # Test product catalog
```

### Manual Testing
```bash
# Test payment flow
curl -X POST http://localhost:9000/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 2999, "currency": "usd"}'

# Test product catalog
curl http://localhost:9000/store/products | jq

# Test health endpoint
curl http://localhost:9000/health
```

## 🚂 Railway Deployment

### Automatic Deployment
1. **Connect Repository**: Link GitHub repo to Railway
2. **Add Services**: PostgreSQL and Redis services
3. **Set Environment Variables**: All integration credentials
4. **Deploy**: Automatic deployment on git push

### Deployment Configuration
- **Build Command**: `npm run build`
- **Start Command**: `npm run kct:setup && npm start`
- **Health Check**: `GET /health`
- **Port**: 9000 (configurable via PORT env var)

### Post-Deployment Verification
```bash
# Test deployed instance
BACKEND_URL="https://your-app.railway.app" npm run kct:test-all
```

## 🔄 Development Commands

### Database Operations
```bash
npm run migration:run          # Run database migrations
npm run migration:generate <name> # Create new migration
npm run seed                   # Seed database with sample data
npm run kct:setup             # Full setup (migrate + seed)
npm run kct:reset             # Reset and reseed database
```

### Development & Testing
```bash
npm run dev                    # Development server with hot reload
npm run kct:dev               # Setup database + start development
npm run build                  # Build for production
npm start                     # Start production server
npm test                      # Run test suite
```

### Integration Testing
```bash
npm run kct:verify            # Basic deployment verification
npm run kct:test-all          # Complete integration test
npm run kct:test-stripe       # Test Stripe payments
npm run kct:test-products     # Test product catalog
```

## 📋 Product Catalog

### Seeded Products
- **Essential White Tee**: Premium cotton t-shirt ($29.99)
  - Variants: Small, Medium, Large, Extra Large
  - Categories: Essentials, T-Shirts, Basics
  - Collections: Essentials Collection, Premium Basics

### Categories
- Essentials
- T-Shirts  
- Basics

### Collections
- Essentials Collection
- Premium Basics

### Region Configuration
- **United States**: USD currency, Stripe + Manual payments

## 🐛 Troubleshooting

### Common Issues

**Service Not Configured**:
```bash
# Check configuration
npm run kct:test-all
# Review missing environment variables
```

**Database Connection**:
```bash
# Test database connection
npm run migration:run
# Check DATABASE_URL format
```

**Payment Issues**:
```bash
# Test Stripe configuration
npm run kct:test-stripe
# Check API keys and webhook configuration
```

**File Upload Issues**:
```bash
# Check R2 configuration
# Test with local storage fallback
# Verify bucket permissions
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check service logs
tail -f logs/medusa.log
```

## 📈 Performance Features

- **Redis Caching**: Session storage and API response caching
- **Database Optimization**: Proper indexing and query optimization
- **File CDN**: Cloudflare R2 with global CDN distribution
- **Connection Pooling**: Optimized database connections
- **Lazy Loading**: Efficient data loading patterns

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **Webhook Verification**: Secure webhook signature validation
- **Environment Security**: Secure environment variable management
- **Rate Limiting**: API rate limiting and abuse prevention

## 📚 Documentation

- **[Integration Guide](./INTEGRATION_GUIDE.md)**: Complete setup instructions for all integrations
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**: Railway deployment instructions
- **[Project Summary](./PROJECT_SUMMARY.md)**: Technical overview and architecture

## 📞 Support & Resources

### Official Documentation
- [Medusa.js Documentation](https://docs.medusajs.com)
- [Railway Documentation](https://docs.railway.app)

### Integration Documentation
- [Stripe API](https://stripe.com/docs/api)
- [EasyPost API](https://www.easypost.com/docs/api)
- [Resend Documentation](https://resend.com/docs)
- [Cloudflare R2](https://developers.cloudflare.com/r2)

### Technical Support
For technical issues:
1. Check the troubleshooting section
2. Review integration test results
3. Check service logs and health endpoints
4. Verify environment variable configuration

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Production-Ready Status**: ✅ **READY FOR DEPLOYMENT**

This backend is fully production-ready with all major e-commerce integrations implemented, tested, and documented. Ready for immediate Railway deployment with comprehensive monitoring and error handling.
