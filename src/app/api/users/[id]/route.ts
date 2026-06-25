import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import { logActivity } from '@/lib/audit'

const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticate(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only SUPER_ADMIN or ADMIN can edit users
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Cannot change your own role/status from here to prevent accidental lockouts
    if (authUser.id === params.id && (validatedData.role || validatedData.isActive !== undefined)) {
      if (validatedData.role !== authUser.role || validatedData.isActive === false) {
         return NextResponse.json({ error: 'Cannot change your own role or deactivate yourself' }, { status: 400 })
      }
    }

    const currentUser = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        phone: true,
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const dataToUpdate: any = {}
    if (validatedData.firstName !== undefined) dataToUpdate.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined) dataToUpdate.lastName = validatedData.lastName
    if (validatedData.phone !== undefined) dataToUpdate.phone = validatedData.phone
    if (validatedData.role !== undefined) dataToUpdate.role = validatedData.role
    if (validatedData.isActive !== undefined) dataToUpdate.isActive = validatedData.isActive

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: dataToUpdate,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        phone: true,
        updatedAt: true,
      }
    })

    // Log update user activity
    await logActivity({
      userId: authUser.id,
      action: 'UPDATE_USER',
      resource: 'USER',
      resourceId: updatedUser.id,
      oldValues: currentUser,
      newValues: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        phone: updatedUser.phone
      },
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
