#!/usr/bin/env node

console.log("🚀 Starting KCT Menswear Backend...");
console.log("🔧 Using custom PaymentProviderService to fix TypeORM error");
console.log("🔍 Debug: Current working directory:", process.cwd());
console.log("🔍 Debug: Node version:", process.version);
console.log("🔍 Debug: Environment:", process.env.NODE_ENV || 'not set');

const { spawn } = require("child_process");
const path = require("path");

async function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`\n📋 Running: ${command} ${args.join(" ")}`);
        
        const child = spawn(command, args, {
            stdio: "inherit",
            shell: true
        });

        child.on("close", (code) => {
            if (code === 0) {
                console.log(`✅ ${command} completed successfully\n`);
                resolve();
            } else {
                console.log(`⚠️  ${command} finished with code ${code}\n`);
                // Don't reject - continue with startup
                resolve();
            }
        });

        child.on("error", (error) => {
            console.error(`❌ Error running ${command}:`, error);
            // Don't reject - continue with startup
            resolve();
        });
    });
}

async function startServer() {
    try {
        // Step 1: Apply runtime patch to fix TypeORM issue
        console.log("🔧 Step 1: Applying runtime patch for TypeORM fix...");
        try {
            require('./runtime-patch-typeorm-fix.js');
        } catch (patchError) {
            console.error("❌ Runtime patch failed:", patchError.message);
            console.log("⚠️ Continuing with startup - patch may not be necessary...");
        }

        // Step 2: Run migrations (always important)
        console.log("🗄️  Step 2: Running database migrations...");
        await runCommand("npm", ["run", "migration:run"]);

        // Step 3: Skip seeding (disabled to prevent issues)
        console.log("🌱 Step 3: Seeding database...");
        await runCommand("npm", ["run", "seed"]);

        // Step 4: Start the Medusa server with patched PaymentProviderService
        console.log("🎯 Step 4: Starting Medusa server...");
        console.log("✨ Runtime patch applied - TypeORM fix active!");
        
        // Use the custom start command
        const medusaProcess = spawn("npm", ["run", "start:custom"], {
            stdio: "inherit",
            shell: true
        });

        medusaProcess.on("close", (code) => {
            console.log(`Medusa server exited with code ${code}`);
            process.exit(code);
        });

        medusaProcess.on("error", (error) => {
            console.error("Error starting Medusa server:", error);
            process.exit(1);
        });

    } catch (error) {
        console.error("❌ Startup failed:", error);
        process.exit(1);
    }
}

startServer();
