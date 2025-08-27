/**
 * Runtime patch to fix TypeORM "Empty criteria" error in Medusa PaymentProviderService
 * 
 * This script patches the original Medusa service at runtime before initialization
 * Since service overrides aren't working, we modify the original service directly
 */

const path = require('path');
const fs = require('fs');

console.log('🔧 [RUNTIME-PATCH] Applying TypeORM fix to original PaymentProviderService...');

function patchPaymentProviderService() {
  try {
    // Path to the original compiled service
    const servicePath = path.join(process.cwd(), 'node_modules/@medusajs/medusa/dist/services/payment-provider.js');
    
    if (!fs.existsSync(servicePath)) {
      console.error('❌ [RUNTIME-PATCH] Original service file not found:', servicePath);
      return false;
    }

    // Read the original service code
    let serviceCode = fs.readFileSync(servicePath, 'utf8');
    
    // Check if already patched
    if (serviceCode.includes('RUNTIME_PATCH_APPLIED')) {
      console.log('✅ [RUNTIME-PATCH] Service already patched, skipping...');
      return true;
    }

    // Find and replace the problematic registerInstalledProviders method
    const originalMethod = /registerInstalledProviders\(providersIds\) {[\s\S]*?return tslib_1\.__awaiter\(this, void 0, void 0, function \* \(\) {[\s\S]*?yield paymentProviderRepo\.update\({}, \{ is_installed: false \}\);[\s\S]*?}\);[\s\S]*?}\);[\s\S]*?}/;
    
    const patchedMethod = `registerInstalledProviders(providersIds) {
        console.log('🔧 [RUNTIME-PATCH] Fixed registerInstalledProviders called - TypeORM fix active!');
        return tslib_1.__awaiter(this, void 0, void 0, function * () {
            return yield this.atomicPhase_(function* (transactionManager) {
                try {
                    // RUNTIME_PATCH_APPLIED - Use QueryBuilder to avoid empty criteria error
                    console.log('🔧 [RUNTIME-PATCH] Using QueryBuilder to fix TypeORM empty criteria issue');
                    
                    // Mark all providers as not installed using QueryBuilder
                    const updateResult = yield transactionManager
                        .createQueryBuilder()
                        .update("payment_provider")
                        .set({ is_installed: false })
                        .execute();
                    
                    console.log(\`🔧 [RUNTIME-PATCH] Marked \${updateResult.affected || 0} providers as not installed\`);
                    
                    // Mark specific providers as installed (if any provided)
                    if (providersIds && providersIds.length > 0) {
                        const installResult = yield transactionManager
                            .createQueryBuilder()
                            .update("payment_provider")
                            .set({ is_installed: true })
                            .where("id IN (:...ids)", { ids: providersIds })
                            .execute();
                        
                        console.log(\`🔧 [RUNTIME-PATCH] Marked \${installResult.affected || 0} specific providers as installed\`);
                    }
                    
                    console.log('✅ [RUNTIME-PATCH] Payment provider registration completed successfully');
                    
                } catch (error) {
                    console.error('❌ [RUNTIME-PATCH] Error during payment provider registration:', error.message);
                    throw error;
                }
            });
        });
    }`;

    // Apply the patch
    if (originalMethod.test(serviceCode)) {
      serviceCode = serviceCode.replace(originalMethod, patchedMethod);
      
      // Write the patched service back
      fs.writeFileSync(servicePath, serviceCode);
      
      console.log('✅ [RUNTIME-PATCH] Successfully patched PaymentProviderService!');
      console.log('✅ [RUNTIME-PATCH] TypeORM "Empty criteria" fix applied to original service');
      return true;
    } else {
      console.warn('⚠️ [RUNTIME-PATCH] Could not find target method to patch');
      return false;
    }
    
  } catch (error) {
    console.error('❌ [RUNTIME-PATCH] Error applying patch:', error.message);
    return false;
  }
}

// Apply the patch
const patchSuccess = patchPaymentProviderService();

if (patchSuccess) {
  console.log('🎯 [RUNTIME-PATCH] Runtime patch completed successfully - Medusa should now start without TypeORM errors');
} else {
  console.error('🚨 [RUNTIME-PATCH] Failed to apply runtime patch - manual intervention required');
}

module.exports = { patchPaymentProviderService };