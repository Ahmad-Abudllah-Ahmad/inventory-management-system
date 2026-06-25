'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useInventoryStore } from '@/store/inventory-store'
import { usePOSStore } from '@/store/pos-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Receipt, 
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Eye,
  Plus,
  BarChart3,
  Package2,
  Printer
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

interface DashboardData {
  todaysSales: number
  todaysSalesGrowth: number
  totalProducts: number
  lowStockItems: number
  totalCustomers: number
  customersGrowth: number
  totalOrders: number
  recentSales: {
    id: string
    saleNumber: string
    customerName: string
    customer?: {
      firstName: string
      lastName?: string | null
      phone?: string | null
    } | null
    amount: number
    time: string
    createdAt: string
    subtotal: number
    taxAmount: number
    discountAmount: number
    totalAmount: number
    paymentMethod: string
    status: string
    returns: any[]
    items: number
    saleItems: {
      id: string
      productId: string
      productName: string
      productSku: string
      quantity: number
      unitPrice: number
      totalPrice: number
      discount: number
    }[]
  }[]
  lowStockItemsList: {
    id: string
    name: string
    currentStock: number
    minStock: number
    category: string
  }[]
  monthlyRevenue: number
  monthlyRevenueGrowth: number
  totalInventoryValue?: number
  revenueChartData: { date: string, revenue: number }[]
  ordersChartData?: { date: string, value: number }[]
  productsChartData?: { date: string, value: number }[]
  customersChartData?: { date: string, value: number }[]
  lowStockChartData?: { date: string, value: number }[]
  inventoryValueChartData?: { date: string, value: number }[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { products, getTotalValue, getLowStockProducts } = useInventoryStore()
  const { getCartItemCount } = usePOSStore()
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard')
        const json = await response.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend, 
    description,
    isLoading,
    chartData,
    isCurrency
  }: {
    title: string
    value: string | number
    change?: number | undefined
    icon: any
    trend?: 'up' | 'down' | undefined
    description?: string | undefined
    isLoading?: boolean | undefined
    chartData?: any[] | undefined
    isCurrency?: boolean
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 bg-muted animate-pulse rounded w-1/2 mb-2"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        
        {chartData && chartData.length > 0 && !isLoading && (
          <div className="h-[40px] w-full mt-2 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0]?.value as number;
                      return (
                        <div className="bg-background border rounded shadow p-1.5 text-[10px] leading-none">
                          <p className="font-semibold">{payload[0]?.payload?.date}</p>
                          <p className="text-muted-foreground mt-0.5 font-medium">
                            {isCurrency ? formatCurrency(val) : formatNumber(val)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                  position={{ y: -20 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={trend === 'down' ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {isLoading ? (
          <div className="h-4 bg-muted animate-pulse rounded w-3/4 mt-2"></div>
        ) : change !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-2">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span>from yesterday</span>
          </div>
        )}
        {!isLoading && description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })} - {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/dashboard/pos">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Open POS
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory/products">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Banner Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            <div className="flex flex-col">
              {loading ? (
                <div className="h-8 bg-muted animate-pulse rounded w-32 mb-2"></div>
              ) : (
                <div className="text-3xl font-bold">{formatCurrency(data?.monthlyRevenue || 0)}</div>
              )}
              {loading ? (
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              ) : (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                  {data?.monthlyRevenueGrowth !== undefined && data.monthlyRevenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={data?.monthlyRevenueGrowth !== undefined && data.monthlyRevenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {data?.monthlyRevenueGrowth && data.monthlyRevenueGrowth > 0 ? '+' : ''}{data?.monthlyRevenueGrowth || 0}%
                  </span>
                  <span>vs last month</span>
                </div>
              )}
            </div>
            
            <div className="h-[60px] w-[150px]">
              {!loading && data?.revenueChartData && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueChartData}>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded shadow p-2 text-xs">
                              <p className="font-semibold">{payload[0]?.payload?.date}</p>
                              <p className="text-muted-foreground">{formatCurrency((payload[0]?.value as number) || 0)}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <StatCard
          title="Orders Today"
          value={formatNumber(data?.totalOrders || 0)}
          icon={Receipt}
          description="Total completed sales"
          isLoading={loading}
          chartData={data?.ordersChartData}
        />
        
        <StatCard
          title="Inventory Value"
          value={formatCurrency(data?.totalInventoryValue || 0)}
          icon={Package}
          description="Total value of current stock"
          isLoading={loading}
          chartData={data?.inventoryValueChartData}
          isCurrency
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/pos">
                <ShoppingCart className="w-6 h-6 mb-2" />
                New Sale
              </Link>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/inventory/products">
                <Package className="w-6 h-6 mb-2" />
                Manage Products
              </Link>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/customers">
                <Users className="w-6 h-6 mb-2" />
                Customer List
              </Link>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/reports">
                <BarChart3 className="w-6 h-6 mb-2" />
                View Reports
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {user?.role !== 'MANAGER' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(data?.todaysSales || 0)}
            change={data?.todaysSalesGrowth}
            trend={data?.todaysSalesGrowth && data.todaysSalesGrowth >= 0 ? "up" : "down"}
            icon={DollarSign}
            description="Revenue from today's transactions"
            isLoading={loading}
            chartData={data?.revenueChartData?.map(item => ({ date: item.date, value: item.revenue }))}
            isCurrency
          />
          
          <StatCard
            title="Total Products"
            value={formatNumber(data?.totalProducts || 0)}
            icon={Package}
            description="Active products in inventory"
            isLoading={loading}
            chartData={data?.productsChartData}
          />
          
          <StatCard
            title="Low Stock Alert"
            value={data?.lowStockItems || 0}
            icon={AlertTriangle}
            description="Items below minimum stock level"
            isLoading={loading}
            chartData={data?.lowStockChartData}
            trend="down"
          />
          
          <StatCard
            title="Total Customers"
            value={formatNumber(data?.totalCustomers || 0)}
            change={data?.customersGrowth}
            trend={data?.customersGrowth && data.customersGrowth >= 0 ? "up" : "down"}
            icon={Users}
            description="Registered customers"
            isLoading={loading}
            chartData={data?.customersChartData}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Recent Sales
            </CardTitle>
            <CardDescription>
              Latest transactions from today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                    </div>
                    <div className="space-y-2 w-1/4 text-right flex flex-col items-end">
                      <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                      <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
                    </div>
                  </div>
                ))
              ) : data?.recentSales && data.recentSales.length > 0 ? (
                data.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{sale.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.items} items • {sale.time}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(sale.amount)}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSale(sale)
                          setShowInvoiceModal(true)
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No sales found for today.
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/sales">
                  View All Sales
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>
              Items that need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50/50">
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                    </div>
                    <div className="space-y-2 w-1/4 text-right flex flex-col items-end">
                      <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                      <div className="h-8 bg-muted animate-pulse rounded w-20"></div>
                    </div>
                  </div>
                ))
              ) : data?.lowStockItemsList && data.lowStockItemsList.length > 0 ? (
                data.lowStockItemsList.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm">
                        <span className="font-semibold text-orange-600">
                          {item.currentStock}
                        </span>
                        <span className="text-muted-foreground">
                          /{item.minStock}
                        </span>
                      </p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/purchases?new=true&productId=${item.id}`}>
                          <Package2 className="w-3 h-3 mr-1" />
                          Restock
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  All items are sufficiently stocked.
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/inventory/alerts">
                  View All Alerts
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoicePreviewModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={mapSaleToOrder(selectedSale)}
      />
    </div>
  )
}

const mapSaleToOrder = (sale: any) => {
  if (!sale) return null
  return {
    id: sale.saleNumber,
    customerName: sale.customerName,
    customerPhone: sale.customer?.phone || '',
    itemsCount: sale.saleItems?.length || 0,
    subtotal: Number(sale.subtotal),
    taxAmount: Number(sale.taxAmount || 0),
    discountAmount: Number(sale.discountAmount || 0),
    total: Number(sale.amount),
    paymentMethod: sale.paymentMethod,
    time: sale.createdAt,
    status: sale.status,
    isRefunded: sale.status === 'RETURNED' || (sale.returns && sale.returns.length > 0),
    items: sale.saleItems?.map((item: any) => ({
      id: item.id,
      productName: item.productName || 'Unknown Product',
      productSku: item.productSku || 'N/A',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      discount: Number(item.discount || 0),
    })) || []
  }
}

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
}

function InvoicePreviewModal({ isOpen, onClose, order }: InvoicePreviewModalProps) {
  if (!isOpen || !order) return null

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                color: #1f2937;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
              }
              .meta {
                text-align: right;
                font-size: 14px;
                color: #4b5563;
              }
              .details {
                margin-bottom: 30px;
                font-size: 14px;
              }
              .details table {
                width: 100%;
              }
              .details td {
                padding: 4px 0;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              .items-table th {
                background-color: #f3f4f6;
                text-align: left;
                padding: 10px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #4b5563;
              }
              .items-table td {
                padding: 12px 10px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
              }
              .summary {
                display: flex;
                justify-content: flex-end;
              }
              .summary-box {
                width: 300px;
                font-size: 14px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
              }
              .summary-total {
                font-size: 18px;
                font-weight: bold;
                border-top: 2px solid #e5e7eb;
                padding-top: 10px;
                margin-top: 10px;
                color: #111827;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px dashed #e5e7eb;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">AL UMER MOBILE</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Premium Mobile & Accessories Store</div>
              </div>
              <div class="meta">
                <div style="font-weight: bold; font-size: 16px;">INVOICE</div>
                <div style="margin-top: 6px;">Invoice #: ${order.id}</div>
                <div>Date: ${new Date(order.time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            </div>

            <div class="details">
              <table style="width: 100%;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                    <div style="font-weight: bold; color: #4b5563; margin-bottom: 4px;">CUSTOMER DETAILS</div>
                    <div style="font-size: 15px; font-weight: 500;">${order.customerName}</div>
                    ${order.customerPhone ? `<div style="color: #6b7280; margin-top: 2px;">Phone: ${order.customerPhone}</div>` : ''}
                  </td>
                  <td style="width: 50%; vertical-align: top; text-align: right;">
                    <div style="font-weight: bold; color: #4b5563; margin-bottom: 4px;">PAYMENT METHOD</div>
                    <div style="font-size: 14px; font-weight: 500; text-transform: uppercase;">${order.paymentMethod || 'CASH'}</div>
                    <div style="margin-top: 4px;"><span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold;">PAID</span></div>
                    ${order.isRefunded ? `
                      <div style="margin-top: 6px;">
                        <span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; border: 1px solid #fca5a5;">
                          REFUNDED & RETURNED TO INVENTORY
                        </span>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map((item: any) => `
                  <tr>
                    <td>
                      <div style="font-weight: 500;">${item.productName}</div>
                      <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">SKU: ${item.productSku}</div>
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">Rs ${item.unitPrice.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; font-weight: 500;">Rs ${item.totalPrice.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>Rs ${(order.subtotal || order.total).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
                ${order.discountAmount > 0 ? `
                  <div class="summary-row" style="color: #dc2626;">
                    <span>Discount</span>
                    <span>-Rs ${order.discountAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                  </div>
                ` : ''}
                ${order.taxAmount > 0 ? `
                  <div class="summary-row">
                    <span>Tax</span>
                    <span>Rs ${order.taxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                  </div>
                ` : ''}
                <div class="summary-row summary-total">
                  <span>Grand Total</span>
                  <span>Rs ${order.total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for shopping at Al Umer Mobile!</p>
              <p style="font-size: 10px; margin-top: 8px;">Software Generated Invoice • No signature required</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-foreground">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-muted/30 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invoice Preview</h3>
            <p className="text-xs text-muted-foreground">Order ID: {order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none text-xl font-semibold"
          >
            &times;
          </button>
        </div>

        {/* Printable Area Container */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-800" id="invoice-print-area">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-blue-600 font-sans">AL UMER MOBILE</h2>
              <p className="text-xs text-gray-500 mt-1">Premium Mobile & Accessories Store</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase tracking-wider font-semibold">
                Paid
              </span>
              {order.isRefunded && (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase tracking-wider font-semibold border border-red-200">
                  Refunded & Returned to Inventory
                </span>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(order.time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Customer / Transaction Details */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="font-bold text-gray-400 text-xs uppercase tracking-wider">Customer Details</p>
              <p className="font-semibold text-gray-800 mt-1">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-xs text-gray-500 mt-1">Phone: {order.customerPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-400 text-xs uppercase tracking-wider">Payment Info</p>
              <p className="font-semibold text-gray-800 mt-1 uppercase">{order.paymentMethod || 'CASH'}</p>
              <p className="text-xs text-gray-500 mt-1">Status: {order.isRefunded ? 'Refunded & Returned to Inventory' : 'Completed'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {order.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">SKU: {item.productSku}</p>
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="flex justify-end text-sm">
            <div className="w-64 space-y-2 border-t pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal || order.total)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2 mt-2">
                <span>Grand Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-muted/20 border-t flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}
