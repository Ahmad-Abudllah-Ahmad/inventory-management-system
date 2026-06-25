import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createUser, createSession } from '@/lib/auth'
import { UserRole } from '@prisma/client'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    
    // Check if database is available
    let user
    try {
      // Check if this is the first user (make them SUPER_ADMIN)
      const userCount = await db.user.count()
      const role: UserRole = userCount === 0 ? 'SUPER_ADMIN' : (validatedData.role || 'STAFF')
      
      // Create user
      user = await createUser({
        email: validatedData.email,
        username: validatedData.username,
        password: validatedData.password,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        ...(validatedData.phone && { phone: validatedData.phone }),
        role,
      })
      
      // Create session
      const sessionToken = await createSession(user.id)
      
      // Create response
      const response = NextResponse.json({
        success: true,
        message: 'Registration successful',
        user,
        token: sessionToken,
      }, { status: 201 })
      
      // Set HTTP-only cookie
      response.cookies.set('auth-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      
      return response
      
    } catch (dbError) {
      // Database not available, return temporary user
      const tempUser = {
        id: `user-${Date.now()}`,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        username: validatedData.username,
        email: validatedData.email,
        role: 'STAFF',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const sessionData = {
        sessionToken: `temp-session-${Date.now()}`,
        userId: tempUser.id,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
      
      const response = NextResponse.json({
        message: 'Registration successful! Note: Database unavailable, using temporary credentials.',
        user: tempUser
      }, { status: 201 })
      
      response.cookies.set('session-token', sessionData.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: sessionData.expires,
        path: '/'
      })
      
      return response
    }
    
  } catch (error) {
    console.error('Registration error:', error)
    
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
