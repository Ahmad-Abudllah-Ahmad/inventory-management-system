import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

const createStockMovementSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createStockMovementSchema.parse(body)

    const product = await db.product.findUnique({
      where: { id: validatedData.productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 })
    }

    const newStock = validatedData.type === 'OUT' 
      ? product.currentStock - validatedData.quantity 
      : product.currentStock + validatedData.quantity

    if (newStock < 0) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    // Use transaction to ensure both records are created/updated securely
    const result = await db.$transaction(async (tx) => {
      const movementType = validatedData.type === 'IN' ? 'PURCHASE' : validatedData.type === 'OUT' ? 'SALE' : 'ADJUSTMENT'
      const movement = await tx.stockMovement.create({
        data: {
          productId: validatedData.productId,
          type: movementType,
          quantity: validatedData.quantity,
          previousStock: product.currentStock,
          newStock: newStock,
          notes: validatedData.notes || 'Manual quick-action restock',
          userId: user.id
        }
      })

      const updatedProduct = await tx.product.update({
        where: { id: validatedData.productId },
        data: { currentStock: newStock }
      })

      return { movement, updatedProduct }
    })

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Create stock movement error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
