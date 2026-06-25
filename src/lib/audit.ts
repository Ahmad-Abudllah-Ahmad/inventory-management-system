import { db } from './db'

export async function logActivity({
  userId,
  action,
  resource,
  resourceId,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
}: {
  userId: string | null
  action: string
  resource: string
  resourceId?: string | null
  oldValues?: any
  newValues?: any
  ipAddress?: string | null
  userAgent?: string | null
}) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId || null,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    console.error('Failed to log audit activity:', err)
  }
}
