import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const period = searchParams.get('period');

    const now = new Date();
    let startDate: Date | null = null;
    let endDate = now;

    if (startDateParam) {
      startDate = new Date(startDateParam);
    }
    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    if (!startDateParam && !endDateParam && period) {
      startDate = new Date(now);
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      endDate = now;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const products = await db.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStockLevel: true,
        costPrice: true,
        sellingPrice: true,
        createdAt: true,
        isActive: true,
        category: {
          select: {
            name: true
          }
        },
        stockMovements: {
          where: {
            createdAt: { gte: sixMonthsAgo }
          },
          select: {
            quantity: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;

    let totalValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    const categoryMap: Record<string, { name: string; productCount: number; value: number; percentage: number; color: string }> = {};
    const criticalStock: any[] = [];

    // Color palette to cycle through for categories
    const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];

    for (const p of products) {
      // Calculate stock at endDate if custom endDate is provided
      let stock = p.currentStock;
      if (endDateParam) {
        const movementsAfter = p.stockMovements.filter(m => new Date(m.createdAt) > endDate);
        const sumQtyAfter = movementsAfter.reduce((sum, m) => sum + m.quantity, 0);
        stock = endDate < p.createdAt ? 0 : Math.max(0, p.currentStock - sumQtyAfter);
      }

      const cost = Number(p.costPrice);
      const val = cost * stock;
      totalValue += val;

      // Critical stock alerts (Out of stock or Low stock below/equal threshold)
      if (stock === 0) {
        outOfStockItems++;
        criticalStock.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: stock,
          minStock: p.minStockLevel,
          costPrice: cost,
          status: 'OUT_OF_STOCK'
        });
      } else if (stock <= p.minStockLevel) {
        lowStockItems++;
        criticalStock.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: stock,
          minStock: p.minStockLevel,
          costPrice: cost,
          status: 'LOW_STOCK'
        });
      }

      // Category details
      const catName = p.category?.name || 'Other';
      if (!categoryMap[catName]) {
        categoryMap[catName] = {
          name: catName,
          productCount: 0,
          value: 0,
          percentage: 0,
          color: colors[Object.keys(categoryMap).length % colors.length] || '#3b82f6'
        };
      }
      const catEntry = categoryMap[catName];
      if (catEntry) {
        catEntry.productCount += 1;
        catEntry.value += val;
      }
    }

    // Calculate category percentages
    const categories = Object.values(categoryMap).map(cat => {
      cat.percentage = totalValue > 0 ? Number(((cat.value / totalValue) * 100).toFixed(1)) : 0;
      return cat;
    }).sort((a, b) => b.value - a.value);

    // If categories is empty, default fallback
    if (categories.length === 0) {
      categories.push({
        name: 'Uncategorized',
        productCount: 0,
        value: 0,
        percentage: 100,
        color: '#3b82f6'
      });
    }

    // Stock Valuation Trend (last 6 months ending at current value)
    const stockTrendData: { label: string; value: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0, 23, 59, 59, 999);
      if (d > endDate) {
        d.setTime(endDate.getTime());
      }
      
      let monthlyValuation = 0;
      for (const p of products) {
        const movementsAfter = p.stockMovements.filter(m => new Date(m.createdAt) > d);
        const sumQtyAfter = movementsAfter.reduce((sum, m) => sum + m.quantity, 0);
        const stockAtDate = d < p.createdAt ? 0 : Math.max(0, p.currentStock - sumQtyAfter);
        monthlyValuation += stockAtDate * Number(p.costPrice);
      }
      
      const label = months[d.getMonth()] || 'Jan';
      stockTrendData.push({
        label,
        value: monthlyValuation
      });
    }

    const valuationSparkline = stockTrendData.map(d => Math.round(d.value / 1000));
    
    const prevMonthVal = stockTrendData.length >= 2 ? stockTrendData[stockTrendData.length - 2]?.value ?? 0 : 0;
    const currMonthVal = totalValue;
    let valueGrowth = 0.0;
    if (prevMonthVal > 0) {
      valueGrowth = Number((((currMonthVal - prevMonthVal) / prevMonthVal) * 100).toFixed(1));
    } else if (currMonthVal > 0) {
      valueGrowth = 100.0;
    }

    const allProducts = products.map(p => {
      let stock = p.currentStock;
      if (endDateParam) {
        const movementsAfter = p.stockMovements.filter(m => new Date(m.createdAt) > endDate);
        const sumQtyAfter = movementsAfter.reduce((sum, m) => sum + m.quantity, 0);
        stock = endDate < p.createdAt ? 0 : Math.max(0, p.currentStock - sumQtyAfter);
      }
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        currentStock: stock,
        minStock: p.minStockLevel,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        totalValue: Number(p.costPrice) * stock
      };
    }).sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json({
      success: true,
      totalValue,
      valueGrowth,
      totalProducts,
      activeProducts,
      lowStockItems,
      outOfStockItems,
      categories,
      criticalStock,
      stockTrendData,
      valuationSparkline,
      allProducts
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate inventory report' },
      { status: 500 }
    );
  }
}
