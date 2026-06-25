import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})

const updateCategorySchema = createCategorySchema.partial()

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Check if category name already exists
    const existingCategory = await db.category.findFirst({
      where: { 
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }

    // Create category
    const category = await db.category.create({
      data: {
        ...validatedData,
        description: validatedData.description || null,
        image: validatedData.image || null,
      },
    })

    // Log create category activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_CATEGORY',
      resource: 'CATEGORY',
      resourceId: category.id,
      newValues: category,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category,
    }, { status: 201 })

  } catch (error) {
    console.error('Create category error:', error)

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
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'created') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'updated') {
      orderBy.updatedAt = sortOrder
    } else {
      orderBy.name = sortOrder
    }

    // Get categories with product count
    const [categories, totalCount] = await Promise.all([
      db.category.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
          products: {
            select: {
              sellingPrice: true,
              currentStock: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.category.count({ where }),
    ])

    // Calculate total value for each category
    const categoriesWithStats = categories.map(category => {
      const totalValue = category.products.reduce((sum, product) => {
        return sum + (Number(product.sellingPrice) * product.currentStock)
      }, 0)

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        productCount: category._count.products,
        totalValue,
      }
    })

    return NextResponse.json({
      success: true,
      data: categoriesWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}