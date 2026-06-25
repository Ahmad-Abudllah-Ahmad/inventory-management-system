import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

const createStockAlertSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(['LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRY_WARNING']),
  threshold: z.number().min(0),
  message: z.string().min(1, 'Message is required'),
})

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
    const validatedData = createStockAlertSchema.parse(body)

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: validatedData.productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 400 }
      )
    }

    // Check if alert already exists for this product and type
    const existingAlert = await db.stockAlert.findFirst({
      where: {
        productId: validatedData.productId,
        type: validatedData.type,
        isActive: true,
      },
    })

    if (existingAlert) {
      return NextResponse.json(
        { error: 'Alert already exists for this product and type' },
        { status: 400 }
      )
    }

    // Create stock alert
    const stockAlert = await db.stockAlert.create({
      data: {
        productId: validatedData.productId,
        type: validatedData.type,
        threshold: validatedData.threshold,
        currentStock: product.currentStock,
        message: validatedData.message,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: {
              select: {
                name: true,
              },
            },
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Stock alert created successfully',
      stockAlert,
    }, { status: 201 })

  } catch (error) {
    console.error('Create stock alert error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
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
    const alertType = searchParams.get('alertType')
    const priority = searchParams.get('priority')
    const isRead = searchParams.get('isRead')
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (alertType && alertType !== 'all') {
      where.type = alertType
    }

    if (isRead !== null && isRead !== 'all') {
      where.isRead = isRead === 'true'
    }

    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'product') {
      orderBy.product = { name: sortOrder }
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Get stock alerts with product details
    const [stockAlerts, totalCount] = await Promise.all([
      db.stockAlert.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              currentStock: true,
              minStockLevel: true,
              maxStockLevel: true,
              category: {
                select: {
                  name: true,
                },
              },
              brand: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.stockAlert.count({ where }),
    ])

    // Transform data to match frontend interface
    const transformedAlerts = stockAlerts.map(alert => {
      // Determine priority based on alert type and stock level
      let priority = 'LOW'
      if (alert.type === 'OUT_OF_STOCK') {
        priority = 'HIGH'
      } else if (alert.type === 'LOW_STOCK' && alert.product.currentStock <= alert.threshold / 2) {
        priority = 'HIGH'
      } else if (alert.type === 'LOW_STOCK') {
        priority = 'MEDIUM'
      }

      return {
        id: alert.id,
        productId: alert.productId,
        productName: alert.product.name,
        sku: alert.product.sku,
        category: alert.product.category?.name || 'Uncategorized',
        brand: alert.product.brand?.name,
        currentStock: alert.currentStock,
        minStockLevel: alert.product.minStockLevel,
        maxStockLevel: alert.product.maxStockLevel,
        alertType: alert.type,
        priority,
        message: alert.message,
        isRead: alert.isRead,
        isActive: alert.isActive,
        createdAt: alert.createdAt.toISOString(),
        lastUpdated: alert.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedAlerts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })

  } catch (error) {
    console.error('Get stock alerts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}