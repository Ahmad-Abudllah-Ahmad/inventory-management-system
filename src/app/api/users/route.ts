import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/audit'

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']),
  phone: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        role: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticate(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only allow SUPER_ADMIN or ADMIN to create users
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if username already exists
    const existingUsername = await db.user.findUnique({
      where: { username: validatedData.username }
    })
    
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    // Check if email already exists (if provided)
    if (validatedData.email) {
      const existingEmail = await db.user.findUnique({
        where: { email: validatedData.email }
      })
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const newUser = await db.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || '',
        email: validatedData.email || '',
        username: validatedData.username,
        password: hashedPassword,
        role: validatedData.role,
        phone: validatedData.phone || null,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Log create user activity
    await logActivity({
      userId: authUser.id,
      action: 'CREATE_USER',
      resource: 'USER',
      resourceId: newUser.id,
      newValues: { id: newUser.id, username: newUser.username, role: newUser.role, firstName: newUser.firstName, lastName: newUser.lastName },
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
