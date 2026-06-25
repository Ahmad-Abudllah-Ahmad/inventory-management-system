import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticate } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Combined product list query to avoid fetching active products list multiple times
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    // Execute all queries in parallel to avoid sequential blocking
    const [
      todaysSalesData,
      yesterdaysSalesData,
      totalProducts,
      productsCombined,
      totalCustomers,
      yesterdaysCustomers,
      recentSalesData,
      monthlySalesData,
      lastMonthSalesData,
      thirtyDaysSales,
      allCustomers,
      stockMovements
    ] = await Promise.all([
      db.sale.aggregate({
        where: {
          createdAt: { gte: today },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      db.sale.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      db.product.count({
        where: { isActive: true }
      }),
      db.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          currentStock: true,
          minStockLevel: true,
          createdAt: true,
          costPrice: true,
          category: { select: { name: true } }
        }
      }),
      db.customer.count(),
      db.customer.count({
        where: { createdAt: { lt: today } }
      }),
      db.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: { include: { product: true } },
          returns: true
        }
      }),
      db.sale.aggregate({
        where: {
          createdAt: { gte: firstDayOfMonth },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      db.sale.aggregate({
        where: {
          createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfMonth },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      db.sale.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'COMPLETED'
        },
        select: { totalAmount: true, createdAt: true }
      }),
      db.customer.findMany({
        select: { createdAt: true }
      }),
      db.stockMovement.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const todaysSales = Number(todaysSalesData._sum.totalAmount || 0)
    const yesterdaysSales = Number(yesterdaysSalesData._sum.totalAmount || 0)
    
    let todaysSalesGrowth = 0
    if (yesterdaysSales > 0) {
      todaysSalesGrowth = ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100
    } else if (todaysSales > 0) {
      todaysSalesGrowth = 100
    }

    // Low Stock Items derived from combined products query
    const lowStockItemsList = productsCombined.filter(p => p.currentStock <= p.minStockLevel)
    const lowStockItems = lowStockItemsList.length

    // Customers growth
    let customersGrowth = 0
    if (yesterdaysCustomers > 0) {
      customersGrowth = ((totalCustomers - yesterdaysCustomers) / yesterdaysCustomers) * 100
    } else if (totalCustomers > 0) {
      customersGrowth = 100
    }

    // Recent Sales processing
    const recentSales = recentSalesData.map(sale => {
      const diffMs = new Date().getTime() - sale.createdAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      let timeStr = 'Just now'
      if (diffDays > 0) timeStr = `${diffDays} days ago`
      else if (diffHours > 0) timeStr = `${diffHours} hours ago`
      else if (diffMins > 0) timeStr = `${diffMins} min ago`

      return {
        id: sale.id,
        saleNumber: sale.saleNumber,
        customerName: sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName || ''}`.trim() : 'Walk-in Customer',
        customer: sale.customer ? {
          firstName: sale.customer.firstName,
          lastName: sale.customer.lastName,
          phone: sale.customer.phone
        } : null,
        amount: Number(sale.totalAmount),
        time: timeStr,
        createdAt: sale.createdAt.toISOString(),
        subtotal: Number(sale.subtotal),
        taxAmount: Number(sale.taxAmount),
        discountAmount: Number(sale.discountAmount),
        totalAmount: Number(sale.totalAmount),
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        returns: sale.returns || [],
        items: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        saleItems: sale.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || 'Unknown Product',
          productSku: item.product?.sku || 'N/A',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          discount: Number(item.discount),
        }))
      }
    })

    const formattedLowStockItems = lowStockItemsList.map(item => ({
      id: item.id,
      name: item.name,
      currentStock: item.currentStock,
      minStock: item.minStockLevel,
      category: item.category?.name || 'Uncategorized'
    }))

    // Monthly Revenue growth
    const monthlyRevenue = Number(monthlySalesData._sum.totalAmount || 0)
    const lastMonthRevenue = Number(lastMonthSalesData._sum.totalAmount || 0)
    let monthlyRevenueGrowth = 0
    if (lastMonthRevenue > 0) {
      monthlyRevenueGrowth = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    } else if (monthlyRevenue > 0) {
      monthlyRevenueGrowth = 100
    }

    // Revenue Chart Data Map processing (O(S))
    const chartDataMap = new Map()
    const ordersChartDataMap = new Map()
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      chartDataMap.set(dateStr, 0)
      ordersChartDataMap.set(dateStr, 0)
    }

    thirtyDaysSales.forEach(sale => {
      const dateStr = sale.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (chartDataMap.has(dateStr)) {
        chartDataMap.set(dateStr, chartDataMap.get(dateStr) + Number(sale.totalAmount))
      }
      if (ordersChartDataMap.has(dateStr)) {
        ordersChartDataMap.set(dateStr, ordersChartDataMap.get(dateStr) + 1)
      }
    })

    const revenueChartData = Array.from(chartDataMap.entries()).map(([date, revenue]) => ({
      date,
      revenue
    }))

    const ordersChartData = Array.from(ordersChartDataMap.entries()).map(([date, value]) => ({
      date,
      value
    }))

    // Total Active Products cumulative chart data (Optimized to O(N log N + N) using sorting and pointer)
    const sortedProducts = [...productsCombined].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    let pIdx = 0
    const productsChartData = []
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      d.setHours(23, 59, 59, 999)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      while (pIdx < sortedProducts.length && sortedProducts[pIdx]!.createdAt <= d) {
        pIdx++
      }
      
      productsChartData.push({
        date: dateStr,
        value: pIdx
      })
    }

    // Total Customers cumulative chart data (Optimized to O(C log C + C) using sorting and pointer)
    const sortedCustomers = [...allCustomers].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    let cIdx = 0
    const customersChartData = []
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      d.setHours(23, 59, 59, 999)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      while (cIdx < sortedCustomers.length && sortedCustomers[cIdx]!.createdAt <= d) {
        cIdx++
      }
      
      customersChartData.push({
        date: dateStr,
        value: cIdx
      })
    }

    // Low stock items and inventory value rollback calculations
    // Group movements by day string key once for fast O(1) lookup
    const movementsByDayStr = new Map<string, typeof stockMovements>()
    stockMovements.forEach(m => {
      const dateKey = m.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!movementsByDayStr.has(dateKey)) {
        movementsByDayStr.set(dateKey, [])
      }
      movementsByDayStr.get(dateKey)!.push(m)
    })

    const productStockMap = new Map()
    productsCombined.forEach(p => productStockMap.set(p.id, p.currentStock))

    const tempLowStockData = []
    const tempInvValData = []

    for (let i = 29; i >= 0; i--) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      d.setHours(23, 59, 59, 999)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      let lowStockCount = 0
      let totalInvValue = 0

      productsCombined.forEach(p => {
        if (p.createdAt > d) return
        const stock = productStockMap.has(p.id) ? productStockMap.get(p.id) : 0
        if (stock <= p.minStockLevel) {
          lowStockCount++
        }
        totalInvValue += stock * Number(p.costPrice)
      })

      tempLowStockData.push({
        date: dateStr,
        value: lowStockCount
      })
      tempInvValData.push({
        date: dateStr,
        value: parseFloat(totalInvValue.toFixed(2))
      })

      // Rollback stock using movements that occurred on this day
      const dayMovements = movementsByDayStr.get(dateStr) || []
      dayMovements.forEach(m => {
        productStockMap.set(m.productId, m.previousStock)
      })
    }

    const lowStockChartData = tempLowStockData.reverse()
    const inventoryValueChartData = tempInvValData.reverse()

    const totalInventoryValue = productsCombined.reduce((sum, p) => sum + p.currentStock * Number(p.costPrice), 0);

    return NextResponse.json({
      success: true,
      data: {
        todaysSales,
        todaysSalesGrowth: parseFloat(todaysSalesGrowth.toFixed(1)),
        totalProducts,
        lowStockItems,
        totalCustomers,
        customersGrowth: parseFloat(customersGrowth.toFixed(1)),
        totalOrders: todaysSalesData._count.id,
        recentSales,
        lowStockItemsList: formattedLowStockItems,
        monthlyRevenue,
        monthlyRevenueGrowth: parseFloat(monthlyRevenueGrowth.toFixed(1)),
        totalInventoryValue,
        revenueChartData,
        ordersChartData,
        productsChartData,
        customersChartData,
        lowStockChartData,
        inventoryValueChartData
      }
    })

  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
