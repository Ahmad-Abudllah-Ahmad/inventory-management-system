import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate, hasPermission } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/utils'
import { logActivity } from '@/lib/audit'

const purchaseItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitCost: z.number().positive(),
  totalCost: z.number().positive(),
})

const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().positive(),
  taxAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED']).default('PENDING'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'MANAGER')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPurchaseSchema.parse(body)

    const supplier = await db.supplier.findUnique({
      where: { id: validatedData.supplierId }
    })

    if (!supplier || !supplier.isActive) {
      return NextResponse.json({ error: 'Supplier not found or inactive' }, { status: 400 })
    }

    const productIds = validatedData.items.map(item => item.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found or inactive' }, { status: 400 })
    }

    const purchaseNumber = generateInvoiceNumber('PUR')
    const statusVal = validatedData.status

    const purchase = await db.$transaction(async (tx) => {
      // Create the purchase order
      const p = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: validatedData.supplierId,
          subtotal: validatedData.subtotal,
          taxAmount: validatedData.taxAmount,
          totalAmount: validatedData.totalAmount,
          status: statusVal,
          orderDate: validatedData.orderDate ? new Date(validatedData.orderDate) : new Date(),
          expectedDate: validatedData.expectedDate ? new Date(validatedData.expectedDate) : null,
          notes: validatedData.notes || null,
          createdById: user.id,
          items: {
            create: validatedData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
              receivedQty: statusVal === 'RECEIVED' ? item.quantity : 0,
            })),
          },
        },
        include: {
          items: { include: { product: { include: { brand: true } } } },
          supplier: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      // Update product stocks & log stock movements only if status is RECEIVED
      if (statusVal === 'RECEIVED') {
        for (const item of validatedData.items) {
          const product = products.find(prod => prod.id === item.productId)
          const previousStock = product ? product.currentStock : 0
          const newStock = previousStock + item.quantity

          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.quantity,
              previousStock: previousStock,
              newStock: newStock,
              reason: 'Purchase order received on creation',
              reference: purchaseNumber,
              userId: user.id,
            },
          })
        }
      }

      return p
    })

    // Log create purchase activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_PURCHASE',
      resource: 'PURCHASE',
      resourceId: purchase.id,
      newValues: purchase,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase order created successfully',
      purchase: {
        ...purchase,
        createdBy: {
          name: `${user.firstName} ${user.lastName}`
        }
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Create purchase error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    const skip = (page - 1) * limit
    const where: any = {}
    
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    const [purchases, totalCount] = await Promise.all([
      db.purchase.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  brand: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          supplier: { select: { id: true, name: true, contactPerson: true, phone: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.purchase.count({ where }),
    ])

    const mappedPurchases = purchases.map(p => ({
      ...p,
      subtotal: Number(p.subtotal),
      taxAmount: Number(p.taxAmount),
      totalAmount: Number(p.totalAmount),
      items: p.items.map(item => ({
        ...item,
        unitCost: Number(item.unitCost),
        totalCost: Number(item.totalCost),
      })),
      createdBy: {
        name: `${p.createdBy.firstName} ${p.createdBy.lastName}`
      }
    }))

    return NextResponse.json({
      success: true,
      data: mappedPurchases,
      purchases: mappedPurchases,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) },
    })

  } catch (error) {
    console.error('Get purchases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
