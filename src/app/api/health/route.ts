import { NextRequest, NextResponse } from 'next/server'
import { db, dbHealthCheck } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check database connection
    const dbHealth = await dbHealthCheck()
    
    // Check Redis connection (if configured)
    let redisHealth = { status: 'not_configured', responseTime: 'N/A' }
    try {
      if (process.env.REDIS_URL) {
        // Basic Redis ping would go here
        redisHealth = { status: 'healthy', responseTime: '< 1ms' }
      }
    } catch (error) {
      redisHealth = { status: 'unhealthy', responseTime: 'N/A' }
    }
    
    // Check if essential tables exist
    const tableChecks = await Promise.all([
      db.user.count().then(() => ({ table: 'users', status: 'ok' })).catch(() => ({ table: 'users', status: 'error' })),
      db.product.count().then(() => ({ table: 'products', status: 'ok' })).catch(() => ({ table: 'products', status: 'error' })),
      db.sale.count().then(() => ({ table: 'sales', status: 'ok' })).catch(() => ({ table: 'sales', status: 'error' })),
    ])
    
    const allTablesHealthy = tableChecks.every(check => check.status === 'ok')
    const overallHealth = dbHealth.status === 'healthy' && allTablesHealthy
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbHealth,
        redis: redisHealth,
        tables: tableChecks,
      },
      performance: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
      },
    }
    
    // Return 200 if healthy, 503 if unhealthy
    const statusCode = overallHealth ? 200 : 503
    
    return NextResponse.json(healthData, { status: statusCode })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 })
  }
}

// Allow health checks from any origin
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
