import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { generateSKU } from '@/lib/utils'
import { logActivity } from '@/lib/audit'

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().min(1, 'Brand is required'),
  costPrice: z.number().positive('Cost price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  minStockLevel: z.number().min(0).default(5),
  maxStockLevel: z.number().positive().optional(),
  currentStock: z.number().min(0).default(0),
  barcode: z.string().optional(),
  images: z.array(z.string()).default([]),
  specifications: z.any().optional(),
  warranty: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  weight: z.number().positive().optional(),
  dimensions: z.any().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

const updateProductSchema = createProductSchema.partial()

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }

    // Check if brand exists (if provided)
    if (validatedData.brandId) {
      const brand = await db.brand.findUnique({
        where: { id: validatedData.brandId }
      })

      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 400 }
        )
      }
    }

    // Generate SKU if not provided
    let sku = validatedData.barcode || generateSKU(validatedData.name, category.name)
    
    // Ensure SKU is unique
    let counter = 1
    const baseSku = sku
    while (await db.product.findUnique({ where: { sku } })) {
      sku = `${baseSku}-${counter}`
      counter++
    }

    // Check if barcode is unique (if provided)
    if (validatedData.barcode) {
      const existingProduct = await db.product.findUnique({
        where: { barcode: validatedData.barcode }
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Barcode already exists' },
          { status: 400 }
        )
      }
    }

    // Create product
    const product = await db.product.create({
      data: {
        ...validatedData,
        sku,
        createdById: user.id,
        description: validatedData.description || null,
        brandId: validatedData.brandId || null,
        barcode: validatedData.barcode || null,
        maxStockLevel: validatedData.maxStockLevel || null,
        warranty: validatedData.warranty || null,
        weight: validatedData.weight || null,
        dimensions: validatedData.dimensions || null,
      },
      include: {
        category: true,
        brand: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create initial stock movement if stock > 0
    if (validatedData.currentStock > 0) {
      await db.stockMovement.create({
        data: {
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: validatedData.currentStock,
          previousStock: 0,
          newStock: validatedData.currentStock,
          reason: 'Initial stock',
          userId: user.id,
        },
      })
    }

    // Log create product activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_PRODUCT',
      resource: 'PRODUCT',
      resourceId: product.id,
      newValues: product,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product,
    }, { status: 201 })

  } catch (error) {
    console.error('Create product error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const brandId = searchParams.get('brandId')
    const isActive = searchParams.get('isActive')
    const lowStock = searchParams.get('lowStock') === 'true'
    const outOfStock = searchParams.get('outOfStock') === 'true'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (brandId) {
      where.brandId = brandId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    if (lowStock) {
      where.AND = [
        { currentStock: { lte: { minStockLevel: true } } },
        { currentStock: { gt: 0 } }
      ]
    }

    if (outOfStock) {
      where.currentStock = 0
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'price') {
      orderBy.sellingPrice = sortOrder
    } else if (sortBy === 'stock') {
      orderBy.currentStock = sortOrder
    } else if (sortBy === 'created') {
      orderBy.createdAt = sortOrder
    } else {
      orderBy.name = sortOrder
    }

    // Get products with related data
    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          stockAlerts: {
            where: { isActive: true },
          },
          _count: {
            select: {
              saleItems: true,
              stockMovements: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })

  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
