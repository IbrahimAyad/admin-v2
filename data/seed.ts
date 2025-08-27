import { MedusaContainer } from "@medusajs/medusa"
import {
  ProductService,
  ProductCategoryService,
  ProductCollectionService,
  UserService,
  RegionService,
  SalesChannelService,
  ShippingOptionService,
  FulfillmentProviderService,
  PaymentProviderService,
  StoreService,
  CurrencyService,
} from "@medusajs/medusa"

const seedAdminUser = async (container: MedusaContainer) => {
  const userService = container.resolve("userService") as UserService
  
  console.log("Seeding admin user...")
  
  try {
    const existingUser = await userService.retrieveByEmail("admin@kctmenswear.com")
    if (existingUser) {
      console.log("Admin user already exists")
      return existingUser
    }
  } catch (error) {
    // User doesn't exist, create new one
  }
  
  const adminUser = await userService.create(
    {
      email: "admin@kctmenswear.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin"
    },
    "KCTAdmin2024!"
  )
  
  console.log("Admin user created successfully")
  return adminUser
}

const seedStore = async (container: MedusaContainer) => {
  const storeService = container.resolve("storeService") as StoreService
  
  console.log("Setting up store...")
  
  try {
    const stores = await storeService.list()
    if (stores.length > 0) {
      const store = stores[0]
      await storeService.update(store.id, {
        name: "KCT Menswear",
        default_currency_code: "usd"
      })
      console.log("Store updated")
      return store
    }
  } catch (error) {
    console.error("Error setting up store:", error)
  }
}

const seedRegion = async (container: MedusaContainer) => {
  const regionService = container.resolve("regionService") as RegionService
  const currencyService = container.resolve("currencyService") as CurrencyService
  
  console.log("Seeding region...")
  
  try {
    const regions = await regionService.list()
    if (regions.length > 0) {
      console.log("Region already exists")
      return regions[0]
    }
  } catch (error) {
    // Continue to create region
  }
  
  // Ensure USD currency exists
  try {
    await currencyService.retrieve("usd")
  } catch (error) {
    await currencyService.create({
      code: "usd",
      symbol: "$",
      symbol_native: "$",
      name: "US Dollar",
    })
  }
  
  const region = await regionService.create({
    name: "United States",
    currency_code: "usd",
    tax_rate: 0,
    payment_providers: ["manual", "stripe"],
    fulfillment_providers: ["manual"],
    countries: ["us"],
  })
  
  console.log("Region created successfully")
  return region
}

const seedSalesChannel = async (container: MedusaContainer) => {
  const salesChannelService = container.resolve("salesChannelService") as SalesChannelService
  
  console.log("Setting up sales channel...")
  
  try {
    const salesChannels = await salesChannelService.list()
    if (salesChannels.length > 0) {
      console.log("Sales channel already exists")
      return salesChannels[0]
    }
  } catch (error) {
    // Continue to create sales channel
  }
  
  const salesChannel = await salesChannelService.create({
    name: "Default Sales Channel",
    description: "Created by seed",
  })
  
  console.log("Sales channel created successfully")
  return salesChannel
}

const seedCategories = async (container: MedusaContainer) => {
  const categoryService = container.resolve("productCategoryService") as ProductCategoryService
  
  console.log("Seeding product categories...")
  
  const categories = [
    {
      name: "Essentials",
      description: "Essential wardrobe basics for everyday wear",
      handle: "essentials",
      is_active: true,
      is_internal: false
    },
    {
      name: "T-Shirts",
      description: "Premium cotton t-shirts and casual wear",
      handle: "t-shirts",
      is_active: true,
      is_internal: false
    },
    {
      name: "Basics",
      description: "Core wardrobe fundamentals",
      handle: "basics",
      is_active: true,
      is_internal: false
    }
  ]
  
  const createdCategories = {}
  
  for (const categoryData of categories) {
    try {
      const existingCategories = await categoryService.listAndCount({ handle: categoryData.handle })
      if (existingCategories[0].length > 0) {
        console.log(`Category ${categoryData.name} already exists`)
        createdCategories[categoryData.handle] = existingCategories[0][0]
        continue
      }
      
      const category = await categoryService.create(categoryData)
      createdCategories[categoryData.handle] = category
      console.log(`Created category: ${categoryData.name}`)
    } catch (error) {
      console.error(`Failed to create category ${categoryData.name}:`, error)
    }
  }
  
  return createdCategories
}

const seedCollections = async (container: MedusaContainer) => {
  const collectionService = container.resolve("productCollectionService") as ProductCollectionService
  
  console.log("Seeding product collections...")
  
  const collections = [
    {
      title: "Essentials Collection",
      handle: "essentials-collection",
      metadata: { description: "Essential wardrobe pieces for everyday comfort" }
    },
    {
      title: "Premium Basics",
      handle: "premium-basics",
      metadata: { description: "High-quality basic clothing items" }
    }
  ]
  
  const createdCollections = {}
  
  for (const collectionData of collections) {
    try {
      const existingCollections = await collectionService.list({ handle: collectionData.handle })
      if (existingCollections.length > 0) {
        console.log(`Collection ${collectionData.title} already exists`)
        createdCollections[collectionData.handle] = existingCollections[0]
        continue
      }
      
      const collection = await collectionService.create(collectionData)
      createdCollections[collectionData.handle] = collection
      console.log(`Created collection: ${collectionData.title}`)
    } catch (error) {
      console.error(`Failed to create collection ${collectionData.title}:`, error)
    }
  }
  
  return createdCollections
}

const seedProducts = async (
  container: MedusaContainer,
  categories: any,
  collections: any,
  region: any,
  salesChannel: any
) => {
  const productService = container.resolve("productService") as ProductService
  
  console.log("Seeding products...")
  
  // Backed-up product data
  const productData = {
    handle: "essential-white-tee",
    title: "Essential White Tee",
    subtitle: "Premium cotton comfort for everyday wear",
    description: "Our Essential White Tee is crafted from 100% premium cotton, offering unparalleled comfort and durability. This versatile piece features a classic fit that works perfectly on its own or as a layering essential. The high-quality fabric maintains its shape and softness wash after wash.",
    thumbnail: "https://imagedelivery.net/QI-O2U_ayTU_H_IlCB4c6Q/kct-essential-white-tee/public",
    weight: 200,
    length: 28,
    width: 20,
    height: 1,
    status: "published",
    is_giftcard: false,
    discountable: true,
    options: [{ title: "Size" }],
    variants: [
      {
        title: "Small",
        prices: [{ currency_code: "usd", amount: 2999, region_id: region?.id }],
        options: [{ value: "Small" }],
        inventory_quantity: 100,
        manage_inventory: true,
        allow_backorder: false
      },
      {
        title: "Medium",
        prices: [{ currency_code: "usd", amount: 2999, region_id: region?.id }],
        options: [{ value: "Medium" }],
        inventory_quantity: 100,
        manage_inventory: true,
        allow_backorder: false
      },
      {
        title: "Large",
        prices: [{ currency_code: "usd", amount: 2999, region_id: region?.id }],
        options: [{ value: "Large" }],
        inventory_quantity: 100,
        manage_inventory: true,
        allow_backorder: false
      },
      {
        title: "Extra Large",
        prices: [{ currency_code: "usd", amount: 2999, region_id: region?.id }],
        options: [{ value: "Extra Large" }],
        inventory_quantity: 100,
        manage_inventory: true,
        allow_backorder: false
      }
    ],
    tags: [{ value: "essentials" }, { value: "basics" }, { value: "cotton" }]
  }
  
  try {
    // Check if product already exists
    const existingProducts = await productService.list({ handle: productData.handle })
    if (existingProducts.length > 0) {
      console.log(`Product ${productData.title} already exists`)
      return existingProducts[0]
    }
    
    // Prepare variants with proper structure
    const variants = productData.variants.map((variant, index) => {
      const variantData = {
        title: variant.title,
        sku: `${productData.handle.toUpperCase().replace(/-/g, '')}-${variant.options[0].value.toUpperCase().replace(/ /g, '')}-${String(index + 1).padStart(3, '0')}`,
        inventory_quantity: variant.inventory_quantity,
        manage_inventory: variant.manage_inventory,
        allow_backorder: variant.allow_backorder,
        prices: variant.prices,
        options: variant.options,
        weight: productData.weight,
        length: productData.length,
        width: productData.width,
        height: productData.height
      }
      return variantData
    })
    
    const product = await productService.create({
      title: productData.title,
      subtitle: productData.subtitle,
      handle: productData.handle,
      description: productData.description,
      status: productData.status,
      is_giftcard: productData.is_giftcard,
      discountable: productData.discountable,
      thumbnail: productData.thumbnail,
      weight: productData.weight,
      length: productData.length,
      width: productData.width,
      height: productData.height,
      options: productData.options,
      variants: variants,
      tags: productData.tags,
      sales_channels: salesChannel ? [{ id: salesChannel.id }] : undefined
    })
    
    // Add to categories
    if (categories["essentials"]) {
      await productService.update(product.id, {
        categories: [{ id: categories["essentials"].id }]
      })
    }
    
    // Add to collections
    if (collections["essentials-collection"]) {
      await productService.update(product.id, {
        collection_id: collections["essentials-collection"].id
      })
    }
    
    console.log(`Created product: ${productData.title} with ${productData.variants.length} variants`)
    return product
  } catch (error) {
    console.error(`Failed to create product ${productData.title}:`, error)
    throw error
  }
}

export default async function seed(container: MedusaContainer): Promise<void> {
  console.log("Starting KCT Menswear seed process...")
  
  try {
    // Seed basic store setup
    await seedStore(container)
    
    // Seed admin user
    await seedAdminUser(container)
    
    // Seed region (required for products)
    const region = await seedRegion(container)
    
    // Seed sales channel
    const salesChannel = await seedSalesChannel(container)
    
    // Seed categories
    const categories = await seedCategories(container)
    
    // Seed collections
    const collections = await seedCollections(container)
    
    // Seed products
    await seedProducts(container, categories, collections, region, salesChannel)
    
    console.log("KCT Menswear seed process completed successfully!")
    console.log("Summary:")
    console.log("- Admin user: admin@kctmenswear.com / KCTAdmin2024!")
    console.log("- Categories: 3 (Essentials, T-Shirts, Basics)")
    console.log("- Collections: 2 (Essentials Collection, Premium Basics)")
    console.log("- Products: 1 (Essential White Tee with 4 variants)")
    console.log("- Region: United States with USD currency")
    console.log("- Sales Channel: Default Sales Channel")
  } catch (error) {
    console.error("Seed process failed:", error)
    throw error
  }
}
