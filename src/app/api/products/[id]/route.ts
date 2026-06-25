import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { z } from 'zod'
import { logActivity } from '@/lib/audit'

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  brandId: z.string().optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  sellingPrice: z.number().positive('Selling price must be positive').optional(),
  minStockLevel: z.number().min(0).optional(),
  maxStockLevel: z.number().positive().optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        brand: true,
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
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
    const validatedData = updateProductSchema.parse(body)

    const currentProduct = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: validatedData as any,
      include: {
        category: true,
        brand: true,
      }
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE_PRODUCT',
      resource: 'PRODUCT',
      resourceId: product.id,
      oldValues: currentProduct,
      newValues: product,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({ success: true, message: 'Product updated successfully', data: product })
  } catch (error) {
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

    const currentProduct = await db.product.findUnique({
      where: { id: params.id }
    })

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await db.product.delete({
      where: { id: params.id }
    })

    await logActivity({
      userId: user.id,
      action: 'DELETE_PRODUCT',
      resource: 'PRODUCT',
      resourceId: params.id,
      oldValues: currentProduct,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
