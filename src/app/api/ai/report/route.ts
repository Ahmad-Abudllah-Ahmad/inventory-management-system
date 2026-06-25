import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/db'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: Request) {
  try {
    const { productId, startDate, endDate } = await request.json()
    
    const sales = await db.saleItem.findMany({
      where: {
        productId,
        soldAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: { sale: true }
    })
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const prompt = `Generate a detailed sales report for product ${productId} from ${startDate} to ${endDate}. Data: ${JSON.stringify(sales)}`
    const result = await model.generateContent(prompt)
    const report = result.response.text()
    
    await db.salesReport.create({
      data: {
        productId,
        totalQuantity: sales.reduce((sum, item) => sum + item.quantity, 0),
        totalRevenue: sales.reduce((sum, item) => sum + Number(item.totalPrice), 0),
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        notes: report
      }
    })
    
    return NextResponse.json({ report })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}