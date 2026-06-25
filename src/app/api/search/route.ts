import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, products: [], customers: [], sales: [] })
    }

    // 0. Search Products (accessible to all authenticated roles)
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: 5,
      orderBy: { name: 'asc' },
    })

    // 1. Search Customers (Only for SUPER_ADMIN, ADMIN, or MANAGER roles)
    let customers: any[] = []
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER') {
      customers = await db.customer.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: 5,
        orderBy: { firstName: 'asc' },
      })
    }

    // 2. Search Sales / Invoices (accessible to all authenticated roles)
    const sales = await db.sale.findMany({
      where: {
        OR: [
          { saleNumber: { contains: q, mode: 'insensitive' } },
          {
            customer: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
          {
            items: {
              some: {
                product: {
                  name: { contains: q, mode: 'insensitive' }
                }
              }
            }
          }
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              }
            }
          }
        },
        returns: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        sellingPrice: Number(p.sellingPrice),
        currentStock: p.currentStock,
      })),
      customers: customers.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName || ''}`.trim(),
        phone: c.phone,
        email: c.email,
      })),
      sales: sales.map(s => ({
        id: s.saleNumber, // map to invoice id
        saleNumber: s.saleNumber,
        customerName: s.customer ? `${s.customer.firstName} ${s.customer.lastName || ''}`.trim() : 'Walk-in Customer',
        customerPhone: s.customer?.phone || '',
        subtotal: Number(s.subtotal),
        taxAmount: Number(s.taxAmount),
        discountAmount: Number(s.discountAmount),
        total: Number(s.totalAmount),
        paymentMethod: s.paymentMethod,
        time: s.createdAt,
        status: s.status,
        isRefunded: s.status === 'RETURNED' || (s.returns && s.returns.length > 0),
        items: s.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          productSku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          discount: Number(item.discount),
        })),
      })),
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
