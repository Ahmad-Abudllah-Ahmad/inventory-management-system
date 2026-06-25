import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  website: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBrandSchema.parse(body)

    const existingBrand = await db.brand.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        }
      }
    })

    if (existingBrand) {
      return NextResponse.json(
        { error: 'Brand name already exists' },
        { status: 400 }
      )
    }

    const brand = await db.brand.create({
      data: {
        name: validatedData.name,
        website: validatedData.website || null,
        logo: validatedData.logo || null,
        isActive: validatedData.isActive,
      },
    })

    // Log create brand activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_BRAND',
      resource: 'BRAND',
      resourceId: brand.id,
      newValues: brand,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Brand created successfully',
      data: brand,
      brand,
    }, { status: 201 })

  } catch (error) {
    console.error('Create brand error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit
    const where: any = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [brands, totalCount] = await Promise.all([
      db.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.brand.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: brands,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Get brands error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
