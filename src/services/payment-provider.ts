import { PaymentProviderService as MedusaPaymentProviderService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";

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
  
  /**
   * Override the problematic registerInstalledProviders method
   * Uses QueryBuilder instead of repository.update() to avoid empty criteria error
   */
  async registerInstalledProviders(providerIds: string[]): Promise<void> {
    return await this.atomicPhase_(async (transactionManager: EntityManager) => {
      console.log("🔧 [FIXED] Using QueryBuilder for payment provider registration");
      console.log(`🔧 [FIXED] Registering ${providerIds.length} payment providers:`, providerIds);

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
   * Additional safety override for any other update operations that might have empty criteria
   * This provides a fallback for other potential TypeORM issues in the payment provider service
   */
  async updateProvider(selector: any, data: any): Promise<void> {
    // Validate that selector is not empty
    if (!selector || (typeof selector === 'object' && Object.keys(selector).length === 0)) {
      console.warn("⚠️ [FIXED] Prevented empty criteria update in PaymentProviderService");
      return;
    }

    // Call the parent method with validated criteria
    return await this.atomicPhase_(async (transactionManager: EntityManager) => {
      const repository = transactionManager.getRepository("payment_provider");
      return await repository.update(selector, data);
    });
  }
}

export default PaymentProviderService;
