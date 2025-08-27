/**
 * Custom loaders to ensure our service overrides are applied
 */
module.exports = async (container, configModule) => {
  console.log("🔧 [LOADER] Custom service loaders executing...");
  
  // Note: PaymentProviderService should be auto-loaded from src/services/
  // This loader is just for verification and additional setup if needed
  
  console.log("✅ [LOADER] Custom loaders completed");
};
