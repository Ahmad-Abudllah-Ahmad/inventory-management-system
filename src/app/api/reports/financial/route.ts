import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    let startDate: Date;
    let endDate = now;

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (endDateParam) {
        endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      switch (period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
      }
    }

    // Calculate previous period dates first
    let prevStartDate = new Date(startDate);
    let prevEndDate = new Date(startDate);
    if (startDateParam) {
      const diff = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - diff);
      prevEndDate = new Date(startDate);
    } else {
      switch (period) {
        case 'week':
          prevStartDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          prevStartDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          prevStartDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          prevStartDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }

    // Calculate start of 5 months ago for trend query
    const startOfFiveMonthsAgo = new Date(endDate.getFullYear(), endDate.getMonth() - 4, 1, 0, 0, 0, 0);

    // Fetch all required database records in parallel using narrow selects
    const [currentSales, currentExpenses, prevSalesData, trendSales] = await Promise.all([
      db.sale.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
        select: {
          totalAmount: true,
          items: {
            select: {
              quantity: true,
              product: {
                select: {
                  costPrice: true
                }
              }
            }
          }
        }
      }),
      db.expense.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        select: {
          amount: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }),
      db.sale.aggregate({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: 'COMPLETED',
        },
        _sum: {
          totalAmount: true
        }
      }),
      db.sale.findMany({
        where: {
          createdAt: { gte: startOfFiveMonthsAgo, lte: endDate },
          status: 'COMPLETED',
        },
        select: {
          totalAmount: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              product: {
                select: {
                  costPrice: true
                }
              }
            }
          }
        }
      })
    ]);

    const currentRevenue = currentSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const currentCogs = currentSales.reduce((sum, s) => {
      let saleCost = 0;
      for (const item of s.items) {
        saleCost += Number(item.product.costPrice) * item.quantity;
      }
      return sum + saleCost;
    }, 0);

    const currentGrossProfit = currentRevenue - currentCogs;
    const currentGrossMargin = currentRevenue > 0 ? Number(((currentGrossProfit / currentRevenue) * 100).toFixed(2)) : 0.00;

    const currentOtherExpenses = currentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const currentTaxLiability = Number((currentGrossProfit * 0.17).toFixed(2));
    const currentNetProfit = currentGrossProfit - currentTaxLiability - currentOtherExpenses;
    const currentNetMargin = currentRevenue > 0 ? Number(((currentNetProfit / currentRevenue) * 100).toFixed(1)) : 0.0;

    const prevRevenue = Number(prevSalesData._sum.totalAmount || 0);

    let monthlyChange = 0.0;
    if (prevRevenue > 0) {
      monthlyChange = Number((((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1));
    } else if (currentRevenue > 0) {
      monthlyChange = 100.0;
    }

    // 4. Expense distribution breakdown
    const expenseMap: Record<string, number> = {};
    let totalOtherExpenses = 0;
    for (const e of currentExpenses) {
      const catName = e.category?.name || 'Other';
      expenseMap[catName] = (expenseMap[catName] || 0) + Number(e.amount);
      totalOtherExpenses += Number(e.amount);
    }

    const totalAllExpenses = currentCogs + totalOtherExpenses;
    const colors = ['#10b981', '#14b8a6', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];
    const expenseList = [
      {
        category: 'Cost of Goods Sold',
        amount: currentCogs,
        percentage: totalAllExpenses > 0 ? Number(((currentCogs / totalAllExpenses) * 100).toFixed(1)) : 0.0,
        color: '#10b981',
      },
    ];

    let colorIdx = 1;
    for (const [catName, amt] of Object.entries(expenseMap)) {
      expenseList.push({
        category: catName,
        amount: amt,
        percentage: totalAllExpenses > 0 ? Number(((amt / totalAllExpenses) * 100).toFixed(1)) : 0.0,
        color: colors[colorIdx % colors.length] || '#14b8a6',
      });
      colorIdx++;
    }

    // Sort expenseList by amount descending
    expenseList.sort((a, b) => b.amount - a.amount);

    // 5. Compute Monthly Trends (last 5 months ending at now)
    const revenueVsCostTrend: { label: string; values: number[] }[] = [];
    const profitTrendData: { label: string; value: number }[] = [];
    const monthlyBreakdown: { month: string; revenue: number; cogs: number; grossProfit: number; margin: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 4; i >= 0; i--) {
      const startOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const queryEnd = endOfMonth > endDate ? endDate : endOfMonth;

      // Filter trendSales in memory instead of executing a database query in a loop
      const monthSales = trendSales.filter(sale => sale.createdAt >= startOfMonth && sale.createdAt <= queryEnd);

      const rev = monthSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const cost = monthSales.reduce((sum, s) => {
        let saleCost = 0;
        for (const item of s.items) {
          saleCost += Number(item.product.costPrice) * item.quantity;
        }
        return sum + saleCost;
      }, 0);
      const profit = rev - cost;
      const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0.0;

      const label = months[startOfMonth.getMonth()] || 'Jan';
      const monthYearLabel = `${startOfMonth.toLocaleString('default', { month: 'long' })} ${startOfMonth.getFullYear()}`;

      revenueVsCostTrend.push({
        label,
        values: [rev, cost, profit],
      });

      profitTrendData.push({
        label,
        value: profit,
      });

      monthlyBreakdown.push({
        month: monthYearLabel,
        revenue: rev,
        cogs: cost,
        grossProfit: profit,
        margin,
      });
    }

    const revenueSparkline = revenueVsCostTrend.map(d => Math.round(d.values[0] || 0));
    const profitSparkline = revenueVsCostTrend.map(d => Math.round(d.values[2] || 0));

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue: currentRevenue,
        cogs: currentCogs,
        grossProfit: currentGrossProfit,
        grossMargin: currentGrossMargin,
        taxLiability: currentTaxLiability,
        netProfit: currentNetProfit,
        netMargin: currentNetMargin,
        monthlyChange: monthlyChange,
      },
      expenses: expenseList,
      revenueVsCostTrend,
      profitTrendData,
      monthlyBreakdown,
      revenueSparkline,
      profitSparkline,
    });
  } catch (error) {
    console.error('Financial report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate financial report' },
      { status: 500 }
    );
  }
}
