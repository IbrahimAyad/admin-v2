# KCT Menswear Backend v2 - Railway Deployment Guide

## Pre-Deployment Checklist

### 1. Repository Setup
- [ ] Repository is clean and contains only the new v2 backend
- [ ] All sensitive data is in environment variables, not committed
- [ ] .env file is in .gitignore
- [ ] README.md is comprehensive and up-to-date

### 2. Railway Configuration
- [ ] GitHub repository is connected to Railway
- [ ] PostgreSQL service is attached
- [ ] Redis service is attached
- [ ] All environment variables are set

### 3. Environment Variables (Production)
```bash
# Required Core Variables
JWT_SECRET=fdd2b4485fdccc420c658710030bf9f9f7818fcbedae44fa5e3bdce2b55740d5
COOKIE_SECRET=0d8ef08bbf7256224c07b6873b2ea71ad88c159877ebe8718db560903b8de128
SESSION_SECRET=a0fad47f58b157099c61b9c830d6e721e6820165bdb4bcc8a66b86217903ccf1
NODE_ENV=production
DATABASE_TYPE=postgres
WORKER_MODE=shared
PORT=9000
HOST=0.0.0.0

# CORS Configuration
STORE_CORS=https://kctmenswear.com,https://www.kctmenswear.com
ADMIN_CORS=https://admin.kctmenswear.com,https://kct-medusa-backend.up.railway.app

# Database & Cache (Auto-provided by Railway services)
DATABASE_URL=postgresql://postgres:FazJkqscPWOFbEkCYFkejtUrEEIfKRTS@metro.proxy.rlwy.net:26775/railway
REDIS_URL=redis://default:DGGdKFKCXmVNQuKCfNnEbKCxIRzIfwDr@hopper.proxy.rlwy.net:21858

# Payment Processing
STRIPE_API_KEY=your_stripe_secret_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW

# Shipping
EASYPOST_API_KEY=your_easypost_api_key_here

# Email Service
RESEND_API_KEY=re_2P3zWsMq_8gLFuPBBg62yT7wAt9NBpoLP

# Admin Configuration
MEDUSA_ADMIN_ONBOARDING_TYPE=default
MEDUSA_ADMIN_ONBOARDING_FLOW=false
```

## Deployment Steps

### Step 1: Push to GitHub
```bash
cd kct-menswear-backend-v2
git init
git add .
git commit -m "Initial commit: Production-ready Medusa v2 backend

- Complete Medusa.js backend with TypeScript
- Railway deployment configuration
- Stripe payment integration
- EasyPost shipping integration  
- Resend email service
- Redis cache configuration
- PostgreSQL database setup
- Product seed with Essential White Tee
- Admin user: admin@kctmenswear.com
- Production-ready environment configuration"

git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Railway Auto-Deployment
- Railway will detect the push and start building
- Monitor deployment logs in Railway dashboard
- Build process will:
  1. Install dependencies (`npm ci`)
  2. Build the application (`npm run build`)
  3. Run setup command (`npm run kct:setup`)
  4. Start the server (`npm start`)

### Step 3: Verify Deployment

#### 3.1 Health Check
```bash
curl https://your-app.railway.app/health
```

#### 3.2 Admin Authentication
```bash
curl -X POST https://your-app.railway.app/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kctmenswear.com","password":"KCTAdmin2024!"}'
```

#### 3.3 Store API
```bash
curl https://your-app.railway.app/store/products
```

#### 3.4 Admin Dashboard
- Navigate to: `https://your-app.railway.app/admin`
- Login with: `admin@kctmenswear.com` / `KCTAdmin2024!`
- Verify products, orders, and settings are accessible

## Post-Deployment Configuration

### 1. Domain Setup (Optional)
- Configure custom domain in Railway dashboard
- Update CORS settings with new domain
- Update DNS records

### 2. SSL Certificate
- Railway provides automatic SSL
- Verify HTTPS is working correctly

### 3. Monitoring
- Set up Railway monitoring and alerts
- Configure log retention
- Monitor resource usage

## Troubleshooting

### Build Failures
1. **Check build logs** in Railway dashboard
2. **Verify environment variables** are set correctly
3. **Check dependencies** in package.json
4. **Validate TypeScript** compilation

### Database Issues
1. **Verify DATABASE_URL** is correct
2. **Check PostgreSQL service** is running
3. **Run migrations manually** if needed:
   ```bash
   railway run npm run migration:run
   ```

### Cache/Redis Issues
1. **Verify REDIS_URL** is correct
2. **Check Redis service** is running
3. **Fallback to local cache** by removing REDIS_URL temporarily

### Admin Dashboard Not Loading
1. **Check admin build** completed successfully
2. **Verify ADMIN_CORS** includes your domain
3. **Check browser console** for JavaScript errors
4. **Try incognito mode** to rule out cache issues

### API Errors
1. **Check server logs** in Railway dashboard
2. **Verify JWT_SECRET** is set correctly
3. **Test endpoints individually** with curl
4. **Check CORS configuration** for your domain

## Success Criteria

- [ ] Application builds and deploys without errors
- [ ] Admin dashboard loads and authentication works
- [ ] Store API returns product data
- [ ] Database migrations run successfully
- [ ] Seed data is populated correctly
- [ ] All integrations (Stripe, EasyPost, Resend) are configured
- [ ] CORS is properly configured for your domains
- [ ] Environment variables are secure and functional

## Rollback Plan

If deployment fails:
1. **Revert to previous commit** if needed
2. **Check Railway service logs** for specific errors
3. **Use Railway CLI** to debug:
   ```bash
   railway login
   railway shell
   npm run migration:show
   ```

## Support Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
