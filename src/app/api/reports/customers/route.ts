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

    const customers = await db.customer.findMany({
      include: {
        sales: {
          select: {
            totalAmount: true
          }
        },
        _count: {
          select: { sales: true }
        }
      }
    });

    const totalCustomers = customers.length;
    let newCustomers = 0;
    let repeatCustomers = 0;
    let totalSpentSum = 0;

    const customersWithSpent = customers.map(c => {
      const calculatedSpent = c.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      return {
        ...c,
        totalSpent: calculatedSpent,
        loyaltyPoints: Math.floor(calculatedSpent / 1000) * 50
      };
    });

    for (const c of customersWithSpent) {
      if (c.createdAt >= startDate && c.createdAt <= endDate) {
        newCustomers++;
      }
      if (c._count.sales > 1) {
        repeatCustomers++;
      }
      totalSpentSum += c.totalSpent;
    }

    const averageSpent = totalCustomers > 0 ? totalSpentSum / totalCustomers : 0;

    const topCustomers = [...customersWithSpent]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName || ''}`.trim(),
        spent: c.totalSpent,
        orders: c._count.sales,
      }));

    const allCustomers = customersWithSpent.map(c => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName || ''}`.trim(),
      email: c.email || 'N/A',
      phone: c.phone || 'N/A',
      spent: c.totalSpent,
      orders: c._count.sales,
      points: c.loyaltyPoints,
      createdAt: c.createdAt
    })).sort((a, b) => b.spent - a.spent);

    return NextResponse.json({
      success: true,
      totalCustomers,
      newCustomers,
      repeatCustomers,
      averageSpent,
      topCustomers,
      allCustomers,
    });
  } catch (error) {
    console.error('Customer report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate customer report' },
      { status: 500 }
    );
  }
}
