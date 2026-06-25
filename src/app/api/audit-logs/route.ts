import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch logs ordered by date
    const logs = await db.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Safe upper limit for performant dashboard rendering
    })

    // Fetch all users to map them in memory
    const dbUsers = await db.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
      },
    })

    // Create a map for fast lookup
    const userMap: Record<string, { name: string; username: string; role: string }> = {
      'admin-001': {
        name: 'Administrator',
        username: 'admin',
        role: 'SUPER_ADMIN',
      },
    }

    for (const u of dbUsers) {
      userMap[u.id] = {
        name: `${u.firstName} ${u.lastName}`.trim(),
        username: u.username,
        role: u.role,
      }
    }

    // Map logs with user details
    const mappedLogs = logs.map(log => {
      const logUser = log.userId ? userMap[log.userId] : null
      return {
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        user: logUser || {
          name: log.userId ? 'Unknown User' : 'System',
          username: log.userId ? 'unknown' : 'system',
          role: 'STAFF',
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: mappedLogs,
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
