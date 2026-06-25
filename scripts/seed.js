const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // 1. Clean existing data
  try {
    await prisma.stockAlert.deleteMany()
    await prisma.saleItem.deleteMany()
    await prisma.sale.deleteMany()
    await prisma.purchaseItem.deleteMany()
    await prisma.purchase.deleteMany()
    await prisma.stockMovement.deleteMany()
    await prisma.productVariant.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.brand.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.user.deleteMany()
    console.log('Cleaned existing data.')
  } catch (err) {
    console.log('Clean up skipped or encountered error (probably tables empty):', err.message)
  }

  // 2. Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@alumermobile.com',
      username: 'admin',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: true,
    }
  })
  console.log('Admin user created:', adminUser.email)

  // 3. Create Categories
  const catSmartphones = await prisma.category.create({
    data: { name: 'Smartphones', description: 'High-end and mid-range mobile devices' }
  })
  const catWatch = await prisma.category.create({
    data: { name: 'Smartwatches', description: 'Wearables and fitness trackers' }
  })
  const catAudio = await prisma.category.create({
    data: { name: 'Audio Accessories', description: 'AirPods, earbuds, and Bluetooth audio accessories' }
  })
  const catCharging = await prisma.category.create({
    data: { name: 'Charging & Cables', description: 'Fast chargers, wireless chargers, and power banks' }
  })
  const catProtection = await prisma.category.create({
    data: { name: 'Protection', description: 'Cases, sleeves, and tempered glass' }
  })
  console.log('Categories created.')

  // 4. Create Brands
  const brandApple = await prisma.brand.create({
    data: { name: 'Apple', website: 'https://apple.com' }
  })
  const brandSamsung = await prisma.brand.create({
    data: { name: 'Samsung', website: 'https://samsung.com' }
  })
  const brandXiaomi = await prisma.brand.create({
    data: { name: 'Xiaomi', website: 'https://mi.com' }
  })
  const brandAnker = await prisma.brand.create({
    data: { name: 'Anker', website: 'https://anker.com' }
  })
  const brandSony = await prisma.brand.create({
    data: { name: 'Sony', website: 'https://sony.com' }
  })
  console.log('Brands created.')

  // 5. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Al Umer Wholesale Accessories',
      contactPerson: 'Umer Farooq',
      phone: '+92-300-9876543',
      email: 'wholesale@alumer.com',
      address: 'Hall Road, Lahore',
    }
  })
  console.log('Suppliers created.')

  // 6. Create Products (15 items)
  const productsData = [
    // Smartphones
    {
      name: 'iPhone 15 Pro Max (256GB, Natural Titanium)',
      sku: 'AP-IP15P-256-NT',
      barcode: '195949012345',
      categoryId: catSmartphones.id,
      brandId: brandApple.id,
      costPrice: 320000.00,
      sellingPrice: 350000.00,
      currentStock: 12,
      minStockLevel: 3,
      maxStockLevel: 50,
    },
    {
      name: 'Samsung Galaxy S24 Ultra (512GB, Titanium Gray)',
      sku: 'SS-S24U-512-TG',
      barcode: '880609512345',
      categoryId: catSmartphones.id,
      brandId: brandSamsung.id,
      costPrice: 340000.00,
      sellingPrice: 380000.00,
      currentStock: 8,
      minStockLevel: 2,
      maxStockLevel: 30,
    },
    {
      name: 'Xiaomi Redmi Note 13 Pro (256GB, Black)',
      sku: 'XM-RN13P-256-BK',
      barcode: '694181212345',
      categoryId: catSmartphones.id,
      brandId: brandXiaomi.id,
      costPrice: 65000.00,
      sellingPrice: 75000.00,
      currentStock: 2, // Low stock (min: 5)
      minStockLevel: 5,
      maxStockLevel: 40,
    },
    {
      name: 'iPhone 13 (128GB, Midnight)',
      sku: 'AP-IP13-128-MN',
      barcode: '195949012352',
      categoryId: catSmartphones.id,
      brandId: brandApple.id,
      costPrice: 180000.00,
      sellingPrice: 200000.00,
      currentStock: 0, // Out of stock (min: 2)
      minStockLevel: 2,
      maxStockLevel: 20,
    },
    // Smartwatches
    {
      name: 'Apple Watch Series 9 (45mm GPS, Midnight)',
      sku: 'AP-WS9-45-MN',
      barcode: '195949012369',
      categoryId: catWatch.id,
      brandId: brandApple.id,
      costPrice: 110000.00,
      sellingPrice: 125000.00,
      currentStock: 6,
      minStockLevel: 3,
      maxStockLevel: 15,
    },
    {
      name: 'Samsung Galaxy Watch 6 (44mm Bluetooth, Graphite)',
      sku: 'SS-GW6-44-GR',
      barcode: '880609512369',
      categoryId: catWatch.id,
      brandId: brandSamsung.id,
      costPrice: 70000.00,
      sellingPrice: 80000.00,
      currentStock: 1, // Low stock (min: 4)
      minStockLevel: 4,
      maxStockLevel: 20,
    },
    // Audio Accessories
    {
      name: 'AirPods Pro (2nd Generation) USB-C',
      sku: 'AP-APP2-USBC',
      barcode: '195949012376',
      categoryId: catAudio.id,
      brandId: brandApple.id,
      costPrice: 55000.00,
      sellingPrice: 65000.00,
      currentStock: 18,
      minStockLevel: 5,
      maxStockLevel: 40,
    },
    {
      name: 'Sony WH-1000XM5 Wireless Headphones (Black)',
      sku: 'SN-XM5-WRLS-BK',
      barcode: '454873612345',
      categoryId: catAudio.id,
      brandId: brandSony.id,
      costPrice: 85000.00,
      sellingPrice: 95000.00,
      currentStock: 0, // Out of stock (min: 2)
      minStockLevel: 2,
      maxStockLevel: 10,
    },
    {
      name: 'Xiaomi Redmi Buds 5 Pro',
      sku: 'XM-RB5P-WH',
      barcode: '694181212376',
      categoryId: catAudio.id,
      brandId: brandXiaomi.id,
      costPrice: 12000.00,
      sellingPrice: 15000.00,
      currentStock: 15,
      minStockLevel: 5,
      maxStockLevel: 30,
    },
    // Charging & Cables
    {
      name: 'Anker Nano Charger 20W (USB-C, White)',
      sku: 'AK-NC20W-W',
      barcode: '848061012345',
      categoryId: catCharging.id,
      brandId: brandAnker.id,
      costPrice: 2500.00,
      sellingPrice: 3500.00,
      currentStock: 45,
      minStockLevel: 10,
      maxStockLevel: 100,
    },
    {
      name: 'Anker PowerCore 24K Power Bank (140W)',
      sku: 'AK-PC24K-140W',
      barcode: '848061012352',
      categoryId: catCharging.id,
      brandId: brandAnker.id,
      costPrice: 22000.00,
      sellingPrice: 28000.00,
      currentStock: 3, // Low stock (min: 5)
      minStockLevel: 5,
      maxStockLevel: 25,
    },
    {
      name: 'Apple USB-C to Lightning Cable 1m',
      sku: 'AP-USBC-LT-1M',
      barcode: '195949012383',
      categoryId: catCharging.id,
      brandId: brandApple.id,
      costPrice: 3500.00,
      sellingPrice: 4500.00,
      currentStock: 25,
      minStockLevel: 8,
      maxStockLevel: 60,
    },
    // Protection
    {
      name: 'iPhone 15 Pro Silicone Case (Midnight)',
      sku: 'AP-IP15P-SC-MN',
      barcode: '195949012390',
      categoryId: catProtection.id,
      brandId: brandApple.id,
      costPrice: 2500.00,
      sellingPrice: 4500.00,
      currentStock: 30,
      minStockLevel: 5,
      maxStockLevel: 80,
    },
    {
      name: 'Premium Tempered Glass for iPhone 15 Pro (2-Pack)',
      sku: 'PR-IP15P-TG-2P',
      barcode: '1234567890200',
      categoryId: catProtection.id,
      brandId: brandApple.id,
      costPrice: 800.00,
      sellingPrice: 1800.00,
      currentStock: 50,
      minStockLevel: 15,
      maxStockLevel: 150,
    },
    {
      name: 'Premium Tempered Glass for Galaxy S24 Ultra',
      sku: 'PR-S24U-TG-2P',
      barcode: '1234567890201',
      categoryId: catProtection.id,
      brandId: brandSamsung.id,
      costPrice: 1000.00,
      sellingPrice: 2000.00,
      currentStock: 0, // Out of stock (min: 10)
      minStockLevel: 10,
      maxStockLevel: 100,
    }
  ]

  const seededProducts = []

  for (const prodInfo of productsData) {
    const createdProduct = await prisma.product.create({
      data: {
        ...prodInfo,
        createdById: adminUser.id,
      }
    })
    seededProducts.push(createdProduct)
    console.log(`Product created: ${createdProduct.name} (SKU: ${createdProduct.sku})`)
  }

  // 7. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      firstName: 'Ahmad',
      lastName: 'Ali',
      email: 'ahmad.ali@email.com',
      phone: '+92-300-1234567',
      address: 'Lahore, Pakistan',
      totalSpent: 15000.00,
      loyaltyPoints: 150,
    }
  })

  const customer2 = await prisma.customer.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Khan',
      email: 'sarah.khan@email.com',
      phone: '+92-301-2345678',
      address: 'Karachi, Pakistan',
      totalSpent: 8500.00,
      loyaltyPoints: 85,
    }
  })

  const customer3 = await prisma.customer.create({
    data: {
      firstName: 'Muhammad',
      lastName: 'Hassan',
      email: 'm.hassan@email.com',
      phone: '+92-302-3456789',
      address: 'Islamabad, Pakistan',
      totalSpent: 22000.00,
      loyaltyPoints: 220,
    }
  })
  console.log('Customers created.')

  // 8. Create Stock Movements (Initial Stock Log)
  const stockMovementsData = seededProducts
    .filter(p => p.currentStock > 0)
    .map(p => ({
      productId: p.id,
      type: 'ADJUSTMENT',
      quantity: p.currentStock,
      previousStock: 0,
      newStock: p.currentStock,
      reason: 'Initial Seed Stock',
      userId: adminUser.id,
    }))

  await prisma.stockMovement.createMany({
    data: stockMovementsData
  })
  console.log('Stock movements logged.')

  // 9. Create Stock Alerts for Low Stock and Out of Stock products
  const alertsData = []
  for (const product of seededProducts) {
    if (product.currentStock === 0) {
      alertsData.push({
        productId: product.id,
        type: 'OUT_OF_STOCK',
        threshold: product.minStockLevel,
        currentStock: 0,
        message: `${product.name} is completely out of stock. Immediate restock required.`,
        isRead: false,
        isActive: true,
      })
    } else if (product.currentStock <= product.minStockLevel) {
      alertsData.push({
        productId: product.id,
        type: 'LOW_STOCK',
        threshold: product.minStockLevel,
        currentStock: product.currentStock,
        message: `${product.name} has dropped below the minimum stock level (${product.minStockLevel}). Only ${product.currentStock} units remain in stock.`,
        isRead: false,
        isActive: true,
      })
    }
  }

  for (const alertInfo of alertsData) {
    const createdAlert = await prisma.stockAlert.create({
      data: alertInfo
    })
    console.log(`Stock alert created for ${productNameById(seededProducts, createdAlert.productId)}: ${createdAlert.type}`)
  }
  console.log('Stock alerts created.')

  console.log('Database seeding completed successfully!')
}

function productNameById(products, id) {
  const p = products.find(prod => prod.id === id)
  return p ? p.name : 'Unknown Product'
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
