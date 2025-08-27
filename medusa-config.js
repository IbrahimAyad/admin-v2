const dotenv = require("dotenv")

let ENV_FILE_NAME = ""
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production"
    break
  case "staging":
    ENV_FILE_NAME = ".env.staging"
    break
  case "test":
    ENV_FILE_NAME = ".env.test"
    break
  case "development":
  default:
    ENV_FILE_NAME = ".env"
    break
}

try {
  dotenv.config({ path: process.cwd() + "/" + ENV_FILE_NAME })
} catch (e) {
  console.log("Environment file not found, using system environment variables")
}

// CORS configuration
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001,http://localhost:9000"
const STORE_CORS = process.env.STORE_CORS || "http://localhost:3000,http://localhost:8000"

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/medusa_db"
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  // Stripe Payment Plugin
  {
    resolve: `medusa-payment-stripe`,
    options: {
      api_key: process.env.STRIPE_API_KEY,
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
  // Cloudflare R2 File Storage
  {
    resolve: "@medusajs/file-local", // Fallback to local if R2 not configured
    options: {
      upload_dir: "uploads",
    },
  },
  // Admin dashboard
  {
    resolve: "@medusajs/admin",
    /** @type {import('@medusajs/admin').PluginOptions} */
    options: {
      autoRebuild: true,
      develop: {
        open: process.env.OPEN_BROWSER !== "false",
      },
    },
  },
]

// Use Cloudflare R2 if configured
if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_ACCESS_KEY_ID && process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
  plugins[2] = {
    resolve: "./src/services/file",
    options: {
      account_id: process.env.CLOUDFLARE_ACCOUNT_ID,
      access_key_id: process.env.CLOUDFLARE_ACCESS_KEY_ID,
      secret_access_key: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      bucket: process.env.CLOUDFLARE_BUCKET || "kct-menswear-uploads",
      public_url: process.env.CLOUDFLARE_PUBLIC_URL,
    },
  }
}

// EasyPost and Resend will be integrated via custom services
// Add configurations here when custom services are implemented

const modules = {
  // Event bus configuration
  eventBus: {
    resolve: "@medusajs/event-bus-redis",
    options: {
      redisUrl: REDIS_URL
    }
  },
  // Cache configuration
  cacheService: {
    resolve: "@medusajs/cache-redis",
    options: {
      redisUrl: REDIS_URL
    }
  },
}

// Use local modules for development
if (process.env.NODE_ENV === "development") {
  modules.eventBus = {
    resolve: "@medusajs/event-bus-local"
  }
  modules.cacheService = {
    resolve: "@medusajs/cache-inmemory"
  }
}

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig: {
    jwt_secret: process.env.JWT_SECRET,
    cookie_secret: process.env.COOKIE_SECRET,
    session_options: {
      secret: process.env.SESSION_SECRET,
    },
    store_cors: STORE_CORS,
    admin_cors: ADMIN_CORS,
    // Database configuration
    database_url: DATABASE_URL,
    database_type: "postgres",
    database_logging: process.env.NODE_ENV !== "production",
    redis_url: REDIS_URL,
    worker_mode: process.env.WORKER_MODE || "shared",
  },
  plugins,
  modules,
}
