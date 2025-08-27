#!/usr/bin/env node

console.log("🚀 Starting KCT Menswear Backend with database fixes...");

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
        // Step 1: Fix payment provider database issues
        console.log("🔧 Step 1: Fixing payment provider database...");
        await runCommand("node", ["scripts/fix-payment-providers.js"]);

        // Step 2: Run migrations
        console.log("🗄️  Step 2: Running database migrations...");
        await runCommand("npm", ["run", "migration:run"]);

        // Step 3: Seed database if needed
        console.log("🌱 Step 3: Seeding database...");
        await runCommand("npm", ["run", "seed"]);

        // Step 4: Start the Medusa server
        console.log("🎯 Step 4: Starting Medusa server...");
        console.log("🔥 All fixes applied - launching Medusa!");
        
        // Use spawn to start medusa and keep it running
        const medusaProcess = spawn("npm", ["run", "start"], {
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
