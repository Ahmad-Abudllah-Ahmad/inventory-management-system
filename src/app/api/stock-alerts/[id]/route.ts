import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

const updateStockAlertSchema = z.object({
  threshold: z.number().min(0).optional(),
  message: z.string().min(1).optional(),
  isRead: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    const stockAlert = await db.stockAlert.findUnique({
      where: { id },
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
    })

    if (!stockAlert) {
      return NextResponse.json(
        { error: 'Stock alert not found' },
        { status: 404 }
      )
    }

    // Determine priority based on alert type and stock level
    let priority = 'LOW'
    if (stockAlert.type === 'OUT_OF_STOCK') {
      priority = 'HIGH'
    } else if (stockAlert.type === 'LOW_STOCK' && stockAlert.product.currentStock <= stockAlert.threshold / 2) {
      priority = 'HIGH'
    } else if (stockAlert.type === 'LOW_STOCK') {
      priority = 'MEDIUM'
    }

    const transformedAlert = {
      id: stockAlert.id,
      productId: stockAlert.productId,
      productName: stockAlert.product.name,
      sku: stockAlert.product.sku,
      category: stockAlert.product.category?.name || 'Uncategorized',
      brand: stockAlert.product.brand?.name,
      currentStock: stockAlert.currentStock,
      minStockLevel: stockAlert.product.minStockLevel,
      maxStockLevel: stockAlert.product.maxStockLevel,
      alertType: stockAlert.type,
      priority,
      message: stockAlert.message,
      threshold: stockAlert.threshold,
      isRead: stockAlert.isRead,
      isActive: stockAlert.isActive,
      createdAt: stockAlert.createdAt.toISOString(),
      lastUpdated: stockAlert.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      stockAlert: transformedAlert,
    })

  } catch (error) {
    console.error('Get stock alert error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const validatedData = updateStockAlertSchema.parse(body)

    // Check if stock alert exists
    const existingAlert = await db.stockAlert.findUnique({
      where: { id },
      include: {
        product: true,
      },
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Stock alert not found' },
        { status: 404 }
      )
    }

    // Update stock alert
    const updateData: any = {}
    if (validatedData.threshold !== undefined) updateData.threshold = validatedData.threshold
    if (validatedData.message !== undefined) updateData.message = validatedData.message
    if (validatedData.isRead !== undefined) updateData.isRead = validatedData.isRead
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const stockAlert = await db.stockAlert.update({
      where: { id },
      data: updateData,
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
    })

    // Determine priority based on alert type and stock level
    let priority = 'LOW'
    if (stockAlert.type === 'OUT_OF_STOCK') {
      priority = 'HIGH'
    } else if (stockAlert.type === 'LOW_STOCK' && stockAlert.product.currentStock <= stockAlert.threshold / 2) {
      priority = 'HIGH'
    } else if (stockAlert.type === 'LOW_STOCK') {
      priority = 'MEDIUM'
    }

    const transformedAlert = {
      id: stockAlert.id,
      productId: stockAlert.productId,
      productName: stockAlert.product.name,
      sku: stockAlert.product.sku,
      category: stockAlert.product.category?.name || 'Uncategorized',
      brand: stockAlert.product.brand?.name,
      currentStock: stockAlert.currentStock,
      minStockLevel: stockAlert.product.minStockLevel,
      maxStockLevel: stockAlert.product.maxStockLevel,
      alertType: stockAlert.type,
      priority,
      message: stockAlert.message,
      threshold: stockAlert.threshold,
      isRead: stockAlert.isRead,
      isActive: stockAlert.isActive,
      createdAt: stockAlert.createdAt.toISOString(),
      lastUpdated: stockAlert.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: 'Stock alert updated successfully',
      stockAlert: transformedAlert,
    })

  } catch (error) {
    console.error('Update stock alert error:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if stock alert exists
    const existingAlert = await db.stockAlert.findUnique({
      where: { id },
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Stock alert not found' },
        { status: 404 }
      )
    }

    // Delete stock alert
    await db.stockAlert.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Stock alert deleted successfully',
    })

  } catch (error) {
    console.error('Delete stock alert error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}