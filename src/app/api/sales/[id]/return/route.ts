import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { generateInvoiceNumber } from '@/lib/utils'
import { logActivity } from '@/lib/audit'

const returnItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  totalPrice: z.coerce.number().positive(),
  reason: z.string().optional()
})

const createReturnSchema = z.object({
  items: z.array(returnItemSchema).min(1, 'At least one item is required'),
  reason: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const saleId = params.id
    const body = await request.json()
    const validatedData = createReturnSchema.parse(body)

    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: { items: true }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    if (sale.status === 'RETURNED' || sale.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Sale is already returned or cancelled' }, { status: 400 })
    }

    // Verify quantities against original sale
    for (const item of validatedData.items) {
      const originalItem = sale.items.find(i => i.productId === item.productId)
      if (!originalItem) {
        return NextResponse.json({ error: `Product not part of this sale` }, { status: 400 })
      }
      
      // Calculate how many of this product have already been returned in previous returns
      const previousReturns = await db.returnItem.aggregate({
        where: {
          return: { saleId: sale.id },
          productId: item.productId
        },
        _sum: { quantity: true }
      })
      const returnedQty = previousReturns._sum.quantity || 0

      if (item.quantity > (originalItem.quantity - returnedQty)) {
        return NextResponse.json({ error: `Cannot return more than originally purchased for product` }, { status: 400 })
      }
    }

    const totalAmount = validatedData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const returnNumber = generateInvoiceNumber('RET')

    const result = await db.$transaction(async (tx) => {
      // Create Return Record
      const returnRecord = await tx.return.create({
        data: {
          returnNumber,
          saleId: sale.id,
          customerId: sale.customerId,
          totalAmount,
          status: 'COMPLETED',
          refundAmount: totalAmount,
          reason: validatedData.reason || 'Customer return',
          items: {
            create: validatedData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              reason: item.reason || 'Customer return',
              condition: 'GOOD'
            }))
          }
        }
      })

      // Update Product Stock and log StockMovements
      for (const item of validatedData.items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } }
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'ADJUSTMENT',
            quantity: item.quantity,
            previousStock: product.currentStock - item.quantity,
            newStock: product.currentStock,
            reason: 'Product returned',
            reference: returnNumber,
            userId: user.id
          }
        })
      }

      // Check if this is a FULL return or PARTIAL return
      // We calculate total returned items for this sale
      const allReturnItems = await tx.returnItem.aggregate({
        where: { return: { saleId: sale.id } },
        _sum: { quantity: true }
      })
      
      const totalReturnedQty = allReturnItems._sum.quantity || 0
      const totalPurchasedQty = sale.items.reduce((sum, item) => sum + item.quantity, 0)

      // Only mark sale as RETURNED if every single item is returned
      if (totalReturnedQty >= totalPurchasedQty) {
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: 'RETURNED' }
        })
      }

      return returnRecord
    })

    // Log return transaction activity
    await logActivity({
      userId: user.id,
      action: 'PROCESS_RETURN',
      resource: 'RETURN',
      resourceId: result.id,
      newValues: result,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Return processed successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Return processing error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
