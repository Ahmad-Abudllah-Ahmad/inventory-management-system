import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
})

interface RouteContext {
  params: {
    id: string
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

    const { id } = context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Get category with product count and total value
    const category = await db.category.findUnique({
      where: { id },
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
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Calculate total value
    const totalValue = category.products.reduce((sum, product) => {
      return sum + (Number(product.sellingPrice) * product.currentStock)
    }, 0)

    const categoryWithStats = {
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

    return NextResponse.json({
      success: true,
      category: categoryWithStats,
    })

  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = context.params
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await db.category.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive'
          },
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 400 }
        )
      }
    }

    // Update category
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.image !== undefined) updateData.image = validatedData.image
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const category = await db.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    // Log update category activity
    await logActivity({
      userId: user.id,
      action: 'UPDATE_CATEGORY',
      resource: 'CATEGORY',
      resourceId: category.id,
      oldValues: existingCategory,
      newValues: category,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category,
    })

  } catch (error) {
    console.error('Update category error:', error)

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products. Please move or delete products first.' },
        { status: 400 }
      )
    }

    // Delete category
    await db.category.delete({
      where: { id }
    })

    // Log delete category activity
    await logActivity({
      userId: user.id,
      action: 'DELETE_CATEGORY',
      resource: 'CATEGORY',
      resourceId: id,
      oldValues: existingCategory,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}