import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticate(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const settings = await db.systemSetting.findMany()
    
    // Group settings by category
    const groupedSettings = settings.reduce((acc, curr) => {
      const category = curr.category
      if (!acc[category]) acc[category] = {}
      
      // Parse values based on type
      let parsedValue: any = curr.value
      if (curr.type === 'number') parsedValue = Number(curr.value)
      else if (curr.type === 'boolean') parsedValue = curr.value === 'true'
      else if (curr.type === 'json') {
        try { parsedValue = JSON.parse(curr.value) } catch (e) { parsedValue = {} }
      }
      
      acc[category][curr.key] = parsedValue
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({ success: true, data: groupedSettings })
  } catch (error) {
    console.error('Fetch settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticate(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only SUPER_ADMIN or ADMIN can modify system-wide settings
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
       return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { settings } = await request.json()
    
    // settings is expected to be an array of { key, value, type, category }
    if (!Array.isArray(settings)) {
       return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 })
    }

    // Process all updates in a transaction
    await db.$transaction(
      settings.map((setting) => {
        let stringValue = setting.value
        if (typeof setting.value !== 'string') {
          stringValue = String(setting.value)
        }
        
        return db.systemSetting.upsert({
          where: { key: setting.key },
          update: { 
            value: stringValue,
            type: setting.type,
            category: setting.category
          },
          create: {
            key: setting.key,
            value: stringValue,
            type: setting.type,
            category: setting.category
          }
        })
      })
    )

    return NextResponse.json({ success: true, message: 'Settings saved successfully' })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
