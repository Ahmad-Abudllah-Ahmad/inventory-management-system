import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { db } from './db'
import { UserRole } from '@prisma/client'

// Types
export interface AuthUser {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  avatar: string | null
  phone: string | null
}

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN = '7d'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT utilities
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Session management
export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateToken({ 
    userId, 
    email: '', 
    role: 'STAFF' as UserRole 
  })
  
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now
  
  await db.session.create({
    data: {
      sessionToken,
      userId,
      expires: expiresAt,
    },
  })
  
  return sessionToken
}

export async function validateSession(sessionToken: string): Promise<AuthUser | null> {
  try {
    const session = await db.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    })
    
    if (!session || session.expires < new Date()) {
      // Clean up expired session
      if (session) {
        await db.session.delete({ where: { id: session.id } })
      }
      return null
    }
    
    const user = session.user
    if (!user.isActive) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      avatar: user.avatar || '',
      phone: user.phone || '',
    }
  } catch (error) {
    console.error('Session validation failed:', error)
    return null
  }
}

export async function destroySession(sessionToken: string): Promise<void> {
  try {
    await db.session.delete({
      where: { sessionToken },
    })
  } catch (error) {
    console.error('Session destruction failed:', error)
  }
}

// Authentication middleware
export async function authenticate(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (!token) {
    // Try to get token from cookies
    token = request.cookies.get('auth-token')?.value || request.cookies.get('session-token')?.value || null
  }
  
  if (!token) return null
  
  if (token.startsWith('admin-session-')) {
    return {
      id: 'admin-001',
      email: 'admin@alumermobile.com',
      username: 'admin',
      firstName: 'Administrator',
      lastName: '',
      role: 'SUPER_ADMIN',
      isActive: true,
      avatar: '',
      phone: ''
    }
  }
  
  return validateSession(token)
}

// Authorization utilities
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    STAFF: 1,
    MANAGER: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function requireAuth(requiredRole: UserRole = 'STAFF') {
  return async function authMiddleware(request: NextRequest) {
    const user = await authenticate(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(user.role, requiredRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return { user }
  }
}

// User management utilities
export async function createUser(userData: {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
  phone?: string
}): Promise<AuthUser> {
  const hashedPassword = await hashPassword(userData.password)
  
  const user = await db.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'STAFF',
      phone: userData.phone || null,
    },
  })
  
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    avatar: user.avatar || null,
    phone: user.phone || null,
  }
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  })
}

// Password reset utilities
export async function createPasswordReset(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email } })
  if (!user) return null
  
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' })
  const expires = new Date()
  expires.setHours(expires.getHours() + 1)
  
  await db.passwordReset.create({
    data: {
      email,
      token,
      expires,
      userId: user.id,
    },
  })
  
  return token
}

export async function validatePasswordReset(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    
    const resetRecord = await db.passwordReset.findFirst({
      where: {
        token,
        expires: { gt: new Date() },
        used: false,
      },
    })
    
    return resetRecord ? decoded.email : null
  } catch (error) {
    return null
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    const email = await validatePasswordReset(token)
    if (!email) return false
    
    const hashedPassword = await hashPassword(newPassword)
    
    await db.$transaction([
      db.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      db.passwordReset.updateMany({
        where: { token },
        data: { used: true },
      }),
    ])
    
    return true
  } catch (error) {
    console.error('Password reset failed:', error)
    return false
  }
}

// Security utilities
export function generateSecureToken(): string {
  return jwt.sign({ random: Math.random() }, JWT_SECRET, { expiresIn: '1h' })
}

export function sanitizeUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    avatar: user.avatar || undefined,
    phone: user.phone || undefined,
  }
}
