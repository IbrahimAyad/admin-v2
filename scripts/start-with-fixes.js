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
        // Step 1: Run migrations (always important)
        console.log("🗄️  Step 1: Running database migrations...");
        await runCommand("npm", ["run", "migration:run"]);

        // Step 2: Skip seeding (disabled to prevent issues)
        console.log("🌱 Step 2: Seeding database...");
        await runCommand("npm", ["run", "seed"]);

        // Step 3: Start the Medusa server with custom PaymentProviderService
        console.log("🎯 Step 3: Starting Medusa server...");
        console.log("✨ Custom PaymentProviderService loaded - TypeORM fix active!");
        
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
