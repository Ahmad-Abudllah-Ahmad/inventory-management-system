import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

const updatePurchaseSchema = z.object({
  status: z.enum(['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED']),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const purchase = await db.purchase.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: { include: { brand: true } } } },
        supplier: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      }
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...purchase,
        subtotal: Number(purchase.subtotal),
        taxAmount: Number(purchase.taxAmount),
        totalAmount: Number(purchase.totalAmount),
        items: purchase.items.map(item => ({
          ...item,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
        })),
        createdBy: {
          name: `${purchase.createdBy.firstName} ${purchase.createdBy.lastName}`
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePurchaseSchema.parse(body)

    // Get current state of the purchase order
    const currentPurchase = await db.purchase.findUnique({
      where: { id: params.id },
      include: { items: true }
    })

    if (!currentPurchase) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const oldStatus = currentPurchase.status
    const newStatus = validatedData.status

    const result = await db.$transaction(async (tx) => {
      // Update purchase order
      const updated = await tx.purchase.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          expectedDate: validatedData.expectedDate ? new Date(validatedData.expectedDate) : null,
          notes: validatedData.notes || null,
        },
        include: {
          items: { include: { product: { include: { brand: true } } } },
          supplier: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        }
      })

      // Handle stock updates based on status transitions
      if (oldStatus !== 'RECEIVED' && newStatus === 'RECEIVED') {
        // Increment stock (Received)
        for (const item of updated.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          const previousStock = product ? product.currentStock : 0
          const newStock = previousStock + item.quantity

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: 'Purchase order status changed to RECEIVED',
              reference: updated.purchaseNumber,
              userId: user.id
            }
          })
        }
      } else if (oldStatus === 'RECEIVED' && newStatus !== 'RECEIVED') {
        // Decrement stock (Undone or cancelled)
        for (const item of updated.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          const previousStock = product ? product.currentStock : 0
          const newStock = Math.max(0, previousStock - item.quantity)

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock }
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'ADJUSTMENT',
              quantity: -item.quantity,
              previousStock,
              newStock,
              reason: `Purchase order status changed from RECEIVED to ${newStatus}`,
              reference: updated.purchaseNumber,
              userId: user.id
            }
          })
        }
      }

      return updated
    })

    // Log update purchase activity
    await logActivity({
      userId: user.id,
      action: 'UPDATE_PURCHASE',
      resource: 'PURCHASE',
      resourceId: result.id,
      oldValues: currentPurchase,
      newValues: result,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: {
        ...result,
        subtotal: Number(result.subtotal),
        taxAmount: Number(result.taxAmount),
        totalAmount: Number(result.totalAmount),
        items: result.items.map(item => ({
          ...item,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
        })),
        createdBy: {
          name: `${result.createdBy.firstName} ${result.createdBy.lastName}`
        }
      }
    })
  } catch (error) {
    console.error('Update purchase error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const purchase = await db.purchase.findUnique({
      where: { id: params.id },
      include: { items: true }
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    await db.$transaction(async (tx) => {
      if (purchase.status === 'RECEIVED') {
        // Decrement stock back
        for (const item of purchase.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          const previousStock = product ? product.currentStock : 0
          const newStock = Math.max(0, previousStock - item.quantity)

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock }
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'ADJUSTMENT',
              quantity: -item.quantity,
              previousStock,
              newStock,
              reason: 'Purchase order deleted',
              reference: purchase.purchaseNumber,
              userId: user.id
            }
          })
        }
      }

      // Delete purchase items manually first
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: params.id }
      })
      // Delete purchase
      await tx.purchase.delete({
        where: { id: params.id }
      })
    })

    // Log delete purchase activity
    await logActivity({
      userId: user.id,
      action: 'DELETE_PURCHASE',
      resource: 'PURCHASE',
      resourceId: params.id,
      oldValues: purchase,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({ success: true, message: 'Purchase order deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
