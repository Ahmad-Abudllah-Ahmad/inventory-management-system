import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 1. Try to authenticate database-backed user first (reads auth-token cookie)
    const dbUser = await authenticate(request)
    if (dbUser) {
      return NextResponse.json({ user: dbUser })
    }

    // 2. Fallback to check session-token (temporary/admin sessions)
    const sessionToken = request.cookies.get('session-token')?.value
    
    if (sessionToken) {
      // Check for admin session
      if (sessionToken.startsWith('admin-session-')) {
        const adminUser = {
          id: 'admin-001',
          name: 'Administrator',
          username: 'admin',
          email: 'admin@alumermobile.com',
          role: 'SUPER_ADMIN',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        return NextResponse.json({ user: adminUser })
      }
      
      // Check for temporary user sessions
      if (sessionToken.startsWith('temp-session-')) {
        const tempUser = {
          id: sessionToken.replace('temp-session-', 'user-'),
          name: 'Temporary User',
          username: 'tempuser',
          email: 'temp@example.com',
          role: 'STAFF',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        return NextResponse.json({ user: tempUser })
      }
    }
    
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
    
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500 }
    )
  }
}
