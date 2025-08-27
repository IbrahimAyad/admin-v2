#!/usr/bin/env node

/**
 * KCT Menswear Backend v2 - Deployment Verification Script
 * 
 * This script verifies that the Medusa deployment is working correctly
 * after deployment to Railway.
 */

const { execSync } = require('child_process')

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
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(title.toUpperCase(), 'cyan')
  log('='.repeat(60), 'cyan')
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

async function testHealthCheck() {
  logSection('Testing Health Check')
  
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

async function testStoreAPI() {
  logSection('Testing Store API')
  
  const endpoints = [
    { path: '/store/products', name: 'Products' },
    { path: '/store/regions', name: 'Regions' },
    { path: '/store/collections', name: 'Collections' }
  ]
  
  let successCount = 0
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`)
      
      let itemCount = 0
      for (const [key, value] of Object.entries(response)) {
        if (Array.isArray(value)) {
          itemCount = value.length
          break
        }
      }
      
      logSuccess(`${endpoint.name}: ${itemCount} items found`)
      successCount++
    } catch (error) {
      logError(`${endpoint.name} failed: ${error.message}`)
    }
  }
  
  return successCount === endpoints.length
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
      return true
    } else {
      logError('Invalid admin response format')
      return false
    }
  } catch (error) {
    logError(`Admin authentication failed: ${error.message}`)
    return false
  }
}

function generateReport(healthOk, storeOk, adminOk) {
  logSection('Deployment Verification Report')
  
  const timestamp = new Date().toISOString()
  logInfo(`Verification completed at: ${timestamp}`)
  logInfo(`Backend URL: ${BACKEND_URL}`)
  
  log('\nTEST RESULTS:', 'yellow')
  
  if (healthOk) {
    logSuccess('Health Check: PASSED')
  } else {
    logError('Health Check: FAILED')
  }
  
  if (storeOk) {
    logSuccess('Store API: PASSED')
  } else {
    logError('Store API: FAILED')
  }
  
  if (adminOk) {
    logSuccess('Admin Authentication: PASSED')
  } else {
    logError('Admin Authentication: FAILED')
  }
  
  log('\nOVERALL STATUS:', 'cyan')
  
  if (healthOk && storeOk && adminOk) {
    logSuccess('🎉 All tests passed! Deployment is successful!')
    logInfo('Admin Dashboard: ' + BACKEND_URL + '/admin')
    logInfo('Admin Login: admin@kctmenswear.com / KCTAdmin2024!')
    return true
  } else {
    logError('⚠️ Some tests failed. Please check the logs above.')
    logInfo('1. Verify environment variables are set correctly')
    logInfo('2. Check Railway deployment logs')
    logInfo('3. Ensure database migrations ran successfully')
    return false
  }
}

async function main() {
  log('KCT MENSWEAR BACKEND V2 - DEPLOYMENT VERIFICATION', 'cyan')
  log('==================================================', 'cyan')
  log(`Verifying deployment at: ${BACKEND_URL}`, 'blue')
  
  try {
    const healthOk = await testHealthCheck()
    const storeOk = await testStoreAPI()
    const adminOk = await testAdminAuth()
    
    const allPassed = generateReport(healthOk, storeOk, adminOk)
    
    process.exit(allPassed ? 0 : 1)
  } catch (error) {
    logError(`Verification failed: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }
