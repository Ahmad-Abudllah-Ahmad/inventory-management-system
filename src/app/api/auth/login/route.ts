import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, createSession, updateUserLastLogin, sanitizeUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/utils'
import { logActivity } from '@/lib/audit'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    
    // TEMPORARY: Hardcoded admin credentials for testing (bypasses database)
    const adminCredentials = {
      email: 'admin@alumergrocery.com',
      password: 'admin123',
      user: {
        id: 'admin-001',
        name: 'Administrator',
        username: 'admin',
        email: 'admin@alumergrocery.com',
        role: 'SUPER_ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    
    // Check for admin credentials first
    if (validatedData.email === adminCredentials.email && 
        validatedData.password === adminCredentials.password) {
      
      // Create session for admin
      const sessionData = {
        sessionToken: `admin-session-${Date.now()}`,
        userId: adminCredentials.user.id,
        expires: new Date(Date.now() + (validatedData.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
      }
      
      // Log admin login activity
      await logActivity({
        userId: adminCredentials.user.id,
        action: 'LOGIN',
        resource: 'AUTH',
        resourceId: adminCredentials.user.id,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        newValues: { email: adminCredentials.user.email, role: adminCredentials.user.role }
      })

      const response = NextResponse.json({
        message: 'Login successful',
        user: adminCredentials.user
      })
      
      // Set session cookie
      response.cookies.set('session-token', sessionData.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: sessionData.expires,
        path: '/'
      })
      
      return response
    }
    
    // Try database lookup for other users
    let user
    try {
      user = await db.user.findUnique({
        where: { email: validatedData.email },
      })
    } catch (dbError) {
      // Database not available, return admin-only message
      return NextResponse.json(
        { error: 'Use admin credentials: admin@alumergrocery.com / admin123' },
        { status: 401 }
      )
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact administrator.' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Create session
    const sessionToken = await createSession(user.id)
    
    // Update last login
    await updateUserLastLogin(user.id)
    
    // Log database user login activity
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      resource: 'AUTH',
      resourceId: user.id,
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      newValues: { email: user.email, role: user.role }
    })

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: sanitizeUser(user),
      token: sessionToken,
    })
    
    // Set HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: validatedData.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days or 7 days
      path: '/',
    }
    
    response.cookies.set('auth-token', sessionToken, cookieOptions)
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    
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
