const { PaymentProviderService: MedusaPaymentProviderService } = require("@medusajs/medusa");

/**
 * Custom PaymentProviderService to fix TypeORM "Empty criteria" error
 * 
 * This service overrides the problematic registerInstalledProviders method
 * that was causing "TypeORMError: Empty criteria(s) are not allowed for the update method"
 * 
 * The issue occurs because Medusa v1.20.6 uses repository.update({}, data) which
 * TypeORM v0.3.11+ blocks as a safety measure against accidental mass updates.
 * 
 * This fix uses QueryBuilder instead, which is the recommended approach.
 */
class PaymentProviderService extends MedusaPaymentProviderService {
  
  constructor(container) {
    console.log("🚀 [SERVICE] Custom PaymentProviderService constructor called - service override active!");
    super(container);
  }

  /**
   * Override the problematic registerInstalledProviders method
   * Uses QueryBuilder instead of repository.update() to avoid empty criteria error
   */
  async registerInstalledProviders(providerIds) {
    console.log("🔧 [FIXED] Custom registerInstalledProviders called - TypeORM fix active!");
    console.log(`🔧 [FIXED] Registering ${providerIds ? providerIds.length : 0} payment providers:`, providerIds);

    return await this.atomicPhase_(async (transactionManager) => {
      try {
        // First, mark all providers as not installed using QueryBuilder
        const updateResult = await transactionManager
          .createQueryBuilder()
          .update("payment_provider")
          .set({ is_installed: false })
          .execute();

        console.log(`🔧 [FIXED] Marked ${updateResult.affected || 0} providers as not installed`);

        // Then mark specific providers as installed (if any provided)
        if (providerIds && providerIds.length > 0) {
          const installResult = await transactionManager
            .createQueryBuilder()
            .update("payment_provider")
            .set({ is_installed: true })
            .where("id IN (:...ids)", { ids: providerIds })
            .execute();

          console.log(`🔧 [FIXED] Marked ${installResult.affected || 0} specific providers as installed`);
        }

        console.log("✅ [FIXED] Payment provider registration completed successfully");

      } catch (error) {
        console.error("❌ [FIXED] Error during payment provider registration:", error.message);
        // Re-throw the error so it can be handled by the caller
        throw error;
      }
    });
  }

  /**
   * Override any other problematic update methods
   */
  async updateProviders(selector, data) {
    console.log("🔧 [FIXED] Custom updateProviders called");
    
    // Validate that selector is not empty
    if (!selector || (typeof selector === 'object' && Object.keys(selector).length === 0)) {
      console.warn("⚠️ [FIXED] Prevented empty criteria update in PaymentProviderService");
      return;
    }

    return await this.atomicPhase_(async (transactionManager) => {
      const repository = transactionManager.getRepository("payment_provider");
      return await repository.update(selector, data);
    });
  }
}

module.exports = PaymentProviderService;
