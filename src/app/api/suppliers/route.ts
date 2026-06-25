import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

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

    const suppliers = await db.supplier.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: suppliers,
    })
  } catch (error) {
    console.error('Get suppliers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
  city: z.string().optional().nullable().or(z.literal('')),
  postalCode: z.string().optional().nullable().or(z.literal('')),
  contactPerson: z.string().optional().nullable().or(z.literal('')),
  taxNumber: z.string().optional().nullable().or(z.literal('')),
  paymentTerms: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
})

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
    const validatedData = createSupplierSchema.parse(body)

    // Check if supplier already exists with the same name
    const existingSupplier = await db.supplier.findUnique({
      where: { name: validatedData.name }
    })

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this name already exists' },
        { status: 400 }
      )
    }

    const supplier = await db.supplier.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        postalCode: validatedData.postalCode || null,
        contactPerson: validatedData.contactPerson || null,
        taxNumber: validatedData.taxNumber || null,
        paymentTerms: validatedData.paymentTerms || null,
        notes: validatedData.notes || null,
        isActive: true
      }
    })

    // Log create supplier activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_SUPPLIER',
      resource: 'SUPPLIER',
      resourceId: supplier.id,
      newValues: supplier,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      data: supplier
    }, { status: 201 })

  } catch (error) {
    console.error('Create supplier error:', error)
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
