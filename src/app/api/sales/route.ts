import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/utils'
import { logActivity } from '@/lib/audit'

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
  totalPrice: z.number().positive(),
})

const createSaleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().positive(),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT', 'CREDIT', 'OTHER']),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().optional(),
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
    const validatedData = createSaleSchema.parse(body)

    // Validate products exist and have sufficient stock
    const productIds = validatedData.items.map(item => item.productId)
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found or inactive' },
        { status: 400 }
      )
    }

    // Check stock availability
    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId)
      if (product && product.currentStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}` },
          { status: 400 }
        )
      }
    }

    // Generate sale number
    const saleNumber = generateInvoiceNumber('SAL')

    // Create sale with transaction
    const result = await db.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: validatedData.customerId || null,
          subtotal: validatedData.subtotal,
          discountAmount: validatedData.discountAmount,
          taxAmount: validatedData.taxAmount,
          totalAmount: validatedData.totalAmount,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: validatedData.amountPaid >= validatedData.totalAmount ? 'COMPLETED' : 'PENDING',
          status: 'COMPLETED',
          notes: validatedData.notes || null,
          salesPersonId: user.id,
          items: {
            create: validatedData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              discount: item.discount,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          salesPerson: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Update product stock
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        })

        // Create stock movement record
        const product = products.find(p => p.id === item.productId)
        if (product) {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              previousStock: product.currentStock,
              newStock: product.currentStock - item.quantity,
              reason: 'Product sold',
              reference: sale.saleNumber,
              userId: user.id,
            },
          })
        }
      }

      // Create payment record if amount paid
      if (validatedData.amountPaid > 0) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            amount: validatedData.amountPaid,
            method: validatedData.paymentMethod,
            status: 'COMPLETED',
            reference: `PAY-${saleNumber}`,
          },
        })
      }

      return sale
    })

    // Check for low stock alerts
    await checkAndCreateStockAlerts(validatedData.items)

    // Log create sale activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_SALE',
      resource: 'SALE',
      resourceId: result.id,
      newValues: result,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Sale created successfully',
      sale: result,
    }, { status: 201 })

  } catch (error) {
    console.error('Create sale error:', error)

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (status) {
      where.status = status
    }

    // Get sales with related data
    const [sales, totalCount] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          salesPerson: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          payments: true,
          returns: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })

  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check and create stock alerts
async function checkAndCreateStockAlerts(items: any[]) {
  for (const item of items) {
    const product = await db.product.findUnique({
      where: { id: item.productId },
    })

    if (product && product.currentStock - item.quantity <= product.minStockLevel) {
      // Check if alert already exists
      const existingAlert = await db.stockAlert.findFirst({
        where: {
          productId: product.id,
          type: product.currentStock - item.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          isActive: true,
        },
      })

      if (!existingAlert) {
        await db.stockAlert.create({
          data: {
            productId: product.id,
            type: product.currentStock - item.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            threshold: product.minStockLevel,
            currentStock: product.currentStock - item.quantity,
            message: product.currentStock - item.quantity === 0
              ? `${product.name} is out of stock`
              : `${product.name} is running low (${product.currentStock - item.quantity} remaining)`,
          },
        })
      }
    }
  }
}
