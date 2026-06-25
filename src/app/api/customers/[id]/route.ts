import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

const updateCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional().nullable(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)

    // Check if phone number already exists for another customer
    const existingCustomer = await db.customer.findFirst({
      where: {
        phone: validatedData.phone,
        id: { not: id }
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      )
    }

    const currentCustomer = await db.customer.findUnique({
      where: { id }
    })

    if (!currentCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customer = await db.customer.update({
      where: { id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        email: validatedData.email || null,
        phone: validatedData.phone,
        address: validatedData.address || null,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE_CUSTOMER',
      resource: 'CUSTOMER',
      resourceId: customer.id,
      oldValues: currentCustomer,
      newValues: customer,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      customer,
    })

  } catch (error) {
    console.error('Update customer error:', error)

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
