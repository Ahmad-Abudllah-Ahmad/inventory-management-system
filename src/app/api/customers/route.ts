import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const customers = await db.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
      include: {
        sales: {
          select: {
            totalAmount: true,
            createdAt: true
          }
        }
      },
      orderBy: { firstName: 'asc' },
      take: 50,
    })

    const data = customers.map(c => {
      const calculatedSpent = c.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      let latestPurchaseDate = c.lastPurchase;
      if (c.sales.length > 0) {
        const dates = c.sales.map(s => new Date(s.createdAt).getTime());
        latestPurchaseDate = new Date(Math.max(...dates));
      }
      return {
        ...c,
        totalSpent: calculatedSpent,
        loyaltyPoints: Math.floor(calculatedSpent / 1000) * 50,
        lastPurchase: latestPurchaseDate,
        sales: undefined
      };
    });

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createCustomerSchema.parse(body)

    // Check if phone number already exists
    const existingCustomer = await db.customer.findUnique({
      where: { phone: validatedData.phone }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      )
    }

    // Create customer
    const customer = await db.customer.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        email: validatedData.email || null,
        phone: validatedData.phone,
        address: validatedData.address || null,
      },
    })

    // Log create customer activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_CUSTOMER',
      resource: 'CUSTOMER',
      resourceId: customer.id,
      newValues: customer,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Customer registered successfully',
      customer,
    }, { status: 201 })

  } catch (error) {
    console.error('Create customer error:', error)

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
