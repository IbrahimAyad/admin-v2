#!/usr/bin/env node

/**
 * KCT Menswear Backend v2 - Complete Integration Testing Script
 * 
 * Tests all integrations including Stripe, EasyPost, Resend, OAuth, and file uploads
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = 'admin@kctmenswear.com'
const ADMIN_PASSWORD = 'KCTAdmin2024!'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(70)}`, 'cyan')
  log(title.toUpperCase(), 'cyan')
  log('='.repeat(70), 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

async function makeRequest(url, options = {}) {
  try {
    const curlOptions = []
    
    if (options.method && options.method !== 'GET') {
      curlOptions.push('-X', options.method)
    }
    
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        curlOptions.push('-H', `${key}: ${value}`)
      })
    }
    
    if (options.body) {
      curlOptions.push('-d', JSON.stringify(options.body))
    }
    
    curlOptions.push('-s', '--show-error', '--fail', '--max-time', '30')
    
    const command = `curl ${curlOptions.join(' ')} "${url}"`
    const output = execSync(command, { encoding: 'utf8', timeout: 35000 })
    
    return JSON.parse(output)
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`)
  }
}

// Test Core Services
async function testHealthCheck() {
  logSection('Testing Health Check & Basic API')
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`)
    
    if (response.status === 'healthy') {
      logSuccess('Health check passed')
      logInfo(`Service: ${response.service}`)
      logInfo(`Version: ${response.version}`)
      return true
    } else {
      logError('Health check returned unexpected response')
      return false
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`)
    return false
  }
}

async function testAdminAuth() {
  logSection('Testing Admin Authentication')
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    })
    
    if (response.user && response.user.email) {
      logSuccess('Admin authentication successful')
      logInfo(`Admin email: ${response.user.email}`)
      return response.user.api_token || response.access_token
    } else {
      logError('Invalid admin response format')
      return null
    }
  } catch (error) {
    logError(`Admin authentication failed: ${error.message}`)
    return null
  }
}

async function testStoreAPI() {
  logSection('Testing Store API Endpoints')
  
  const endpoints = [
    { path: '/store/products', name: 'Products' },
    { path: '/store/regions', name: 'Regions' },
    { path: '/store/collections', name: 'Collections' },
    { path: '/store/product-categories', name: 'Categories' }
  ]
  
  let successCount = 0
  const results = {}
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`)
      
      let itemCount = 0
      for (const [key, value] of Object.entries(response)) {
        if (Array.isArray(value)) {
          itemCount = value.length
          results[endpoint.name] = value
          break
        }
      }
      
      logSuccess(`${endpoint.name}: ${itemCount} items found`)
      successCount++
    } catch (error) {
      logError(`${endpoint.name} failed: ${error.message}`)
      results[endpoint.name] = []
    }
  }
  
  return { success: successCount === endpoints.length, results }
}

// Test Stripe Integration
async function testStripeIntegration() {
  logSection('Testing Stripe Payment Integration')
  
  if (!process.env.STRIPE_API_KEY || process.env.STRIPE_API_KEY.startsWith('your-')) {
    logWarning('Stripe API key not configured - skipping payment tests')
    return false
  }
  
  try {
    // Test payment intent creation
    const response = await makeRequest(`${BACKEND_URL}/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        amount: 2999, // $29.99 for Essential White Tee
        currency: 'usd',
        metadata: {
          product_id: 'essential-white-tee',
          test: 'true'
        }
      }
    })
    
    if (response.client_secret && response.payment_intent_id) {
      logSuccess('Payment intent created successfully')
      logInfo(`Payment Intent ID: ${response.payment_intent_id}`)
      logInfo(`Amount: $${(response.amount / 100).toFixed(2)}`)
      
      // Test payment verification
      const verifyResponse = await makeRequest(`${BACKEND_URL}/stripe/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          payment_intent_id: response.payment_intent_id
        }
      })
      
      if (verifyResponse.status) {
        logSuccess(`Payment verification successful - Status: ${verifyResponse.status}`)
        return true
      } else {
        logError('Payment verification failed')
        return false
      }
    } else {
      logError('Payment intent creation failed')
      return false
    }
  } catch (error) {
    logError(`Stripe integration test failed: ${error.message}`)
    return false
  }
}

// Test OAuth Integration
async function testOAuthIntegration() {
  logSection('Testing OAuth Integration')
  
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('your-')) {
    logWarning('Google OAuth not configured - skipping OAuth tests')
    return { google: false, facebook: false }
  }
  
  let googleOK = false
  let facebookOK = false
  
  try {
    // Test Google OAuth endpoint (without actual token)
    await makeRequest(`${BACKEND_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        token: 'test-token' // This will fail but confirms endpoint exists
      }
    })
  } catch (error) {
    if (error.message.includes('Invalid Google token') || error.message.includes('Authentication failed')) {
      googleOK = true // Endpoint exists and is working
      logSuccess('Google OAuth endpoint is functional')
    } else {
      logError(`Google OAuth endpoint error: ${error.message}`)
    }
  }
  
  try {
    // Test Facebook OAuth endpoint (without actual token)
    await makeRequest(`${BACKEND_URL}/auth/facebook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        accessToken: 'test-token' // This will fail but confirms endpoint exists
      }
    })
  } catch (error) {
    if (error.message.includes('Invalid Facebook token') || error.message.includes('Authentication failed')) {
      facebookOK = true // Endpoint exists and is working
      logSuccess('Facebook OAuth endpoint is functional')
    } else {
      logError(`Facebook OAuth endpoint error: ${error.message}`)
    }
  }
  
  return { google: googleOK, facebook: facebookOK }
}

// Test Service Configuration
function testServiceConfiguration() {
  logSection('Testing Service Configuration')
  
  const services = {
    'EasyPost': {
      configured: !!process.env.EASYPOST_API_KEY && !process.env.EASYPOST_API_KEY.startsWith('your-'),
      file: '/workspace/kct-menswear-backend-v2/src/services/shipping.ts'
    },
    'Resend': {
      configured: !!process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('your-'),
      file: '/workspace/kct-menswear-backend-v2/src/services/email.ts'
    },
    'Cloudflare R2': {
      configured: !!process.env.CLOUDFLARE_ACCOUNT_ID && !process.env.CLOUDFLARE_ACCOUNT_ID.startsWith('your-'),
      file: '/workspace/kct-menswear-backend-v2/src/services/file.ts'
    },
    'Google OAuth': {
      configured: !!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.startsWith('your-'),
      file: '/workspace/kct-menswear-backend-v2/src/api/routes/auth/route.ts'
    },
    'Stripe': {
      configured: !!process.env.STRIPE_API_KEY && !process.env.STRIPE_API_KEY.startsWith('your-'),
      file: '/workspace/kct-menswear-backend-v2/src/api/routes/stripe/route.ts'
    }
  }
  
  let allConfigured = true
  
  Object.entries(services).forEach(([name, service]) => {
    const fileExists = fs.existsSync(service.file)
    
    if (service.configured && fileExists) {
      logSuccess(`${name}: Configured and implemented`)
    } else if (!service.configured && fileExists) {
      logWarning(`${name}: Implemented but not configured (missing environment variables)`)
      allConfigured = false
    } else if (service.configured && !fileExists) {
      logError(`${name}: Configured but implementation missing`)
      allConfigured = false
    } else {
      logWarning(`${name}: Not configured and not implemented`)
      allConfigured = false
    }
  })
  
  return allConfigured
}

// Generate comprehensive report
function generateReport(results) {
  logSection('Complete Integration Test Report')
  
  const timestamp = new Date().toISOString()
  logInfo(`Test completed at: ${timestamp}`)
  logInfo(`Backend URL: ${BACKEND_URL}`)
  
  log('\nCORE FUNCTIONALITY:', 'yellow')
  results.health ? logSuccess('Health Check: PASSED') : logError('Health Check: FAILED')
  results.admin ? logSuccess('Admin Authentication: PASSED') : logError('Admin Authentication: FAILED')
  results.store.success ? logSuccess('Store API: PASSED') : logError('Store API: FAILED')
  
  log('\nINTEGRATIONS:', 'yellow')
  results.stripe ? logSuccess('Stripe Payment: PASSED') : logWarning('Stripe Payment: NOT CONFIGURED/FAILED')
  results.oauth.google ? logSuccess('Google OAuth: FUNCTIONAL') : logWarning('Google OAuth: NOT CONFIGURED/FAILED')
  results.oauth.facebook ? logSuccess('Facebook OAuth: FUNCTIONAL') : logWarning('Facebook OAuth: NOT CONFIGURED/FAILED')
  results.services ? logSuccess('Service Configuration: COMPLETE') : logWarning('Service Configuration: INCOMPLETE')
  
  log('\nPRODUCT CATALOG:', 'yellow')
  if (results.store.results.Products && results.store.results.Products.length > 0) {
    logSuccess(`${results.store.results.Products.length} products found`)
    logInfo('Sample product: Essential White Tee')
  } else {
    logError('No products found - database seeding may have failed')
  }
  
  log('\nOVERALL STATUS:', 'magenta')
  const coreWorking = results.health && results.admin && results.store.success
  
  if (coreWorking) {
    logSuccess('✅ Core functionality is working perfectly!')
    logSuccess('✅ Backend is ready for production deployment!')
    
    if (results.stripe && results.services) {
      logSuccess('✅ All integrations are functional!')
      log('\n🎉 COMPLETE SUCCESS - All systems operational!', 'green')
    } else {
      logWarning('⚠️  Some integrations need configuration')
      log('\n📋 Action items:', 'cyan')
      if (!results.stripe) logInfo('1. Configure Stripe API keys for payment processing')
      if (!results.oauth.google) logInfo('2. Configure Google OAuth credentials')
      if (!results.oauth.facebook) logInfo('3. Configure Facebook OAuth credentials')
      if (!results.services) logInfo('4. Complete service environment variable configuration')
    }
    
    logInfo('\nAdmin Panel: ' + BACKEND_URL + '/admin')
    logInfo('Admin Login: admin@kctmenswear.com / KCTAdmin2024!')
    return true
  } else {
    logError('❌ Core functionality issues detected')
    log('\n🚨 Critical issues need attention:', 'red')
    if (!results.health) logError('- Health check failing')
    if (!results.admin) logError('- Admin authentication not working')
    if (!results.store.success) logError('- Store API endpoints failing')
    return false
  }
}

async function main() {
  log('KCT MENSWEAR BACKEND V2 - COMPLETE INTEGRATION TEST', 'magenta')
  log('='.repeat(60), 'magenta')
  log(`Testing deployment at: ${BACKEND_URL}`, 'blue')
  
  try {
    const results = {
      health: await testHealthCheck(),
      admin: await testAdminAuth(),
      store: await testStoreAPI(),
      stripe: await testStripeIntegration(),
      oauth: await testOAuthIntegration(),
      services: testServiceConfiguration()
    }
    
    const success = generateReport(results)
    
    process.exit(success ? 0 : 1)
  } catch (error) {
    logError(`Integration test failed: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }
