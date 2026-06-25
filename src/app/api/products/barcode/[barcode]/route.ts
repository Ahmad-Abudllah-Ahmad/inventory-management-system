import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

interface RouteContext {
  params: {
    barcode: string
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { barcode } = context.params

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Find product by barcode or SKU
    const product = await db.product.findFirst({
      where: {
        OR: [
          { barcode: barcode },
          { sku: barcode },
        ],
        isActive: true,
      },
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
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check stock status
    const stockStatus = product.currentStock === 0 
      ? 'OUT_OF_STOCK' 
      : product.currentStock <= product.minStockLevel 
        ? 'LOW_STOCK' 
        : 'IN_STOCK'

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        stockStatus,
      },
    })

  } catch (error) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
