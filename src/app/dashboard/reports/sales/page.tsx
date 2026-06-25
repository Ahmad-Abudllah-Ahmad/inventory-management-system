'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  FileText,
  Printer
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { AreaChart, BarChart, DonutChart, GroupedBarChart, Sparkline } from '@/components/ui/charts'
import toast from 'react-hot-toast'

export default function SalesReportPage() {
  const [timePeriod, setTimePeriod] = useState('month')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCustomDate, setIsCustomDate] = useState(false)

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        let url = `/api/reports/sales?period=${timePeriod}`
        if (isCustomDate && startDate.length === 10 && endDate.length === 10) {
          url = `/api/reports/sales?startDate=${startDate}&endDate=${endDate}`
        }
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          toast.error('Failed to generate sales report')
        }
      } catch (err) {
        console.error('Failed to load sales report', err)
        toast.error('An error occurred loading the report')
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [timePeriod, isCustomDate, startDate, endDate])

  // Sparkline data fallbacks
  const revenueSparkline = data?.dailyTrend?.length >= 2 
    ? data.dailyTrend.map((d: any) => d.revenue)
    : [38, 42, 39, 45, 40, 52, 61]

  const ordersSparkline = data?.dailyTrend?.length >= 2
    ? data.dailyTrend.map((d: any) => d.orders ?? 0)
    : [40, 45, 42, 48, 44, 55, 60]

  // Chart data mapping
  const dailyTrendData = data?.dailyTrend?.map((d: any, index: number) => {
    let label = '';
    const dateObj = new Date(d.date);
    if (timePeriod === 'week') {
      label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timePeriod === 'year') {
      label = dateObj.toLocaleDateString('en-US', { month: 'short' });
    } else if (timePeriod === 'month') {
      if (index % 5 === 0 || index === data.dailyTrend.length - 1) {
        label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } else {
        label = '';
      }
    } else if (timePeriod === 'quarter') {
      if (index % 15 === 0 || index === data.dailyTrend.length - 1) {
        label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } else {
        label = '';
      }
    } else {
      label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }
    return {
      label,
      value: d.revenue
    };
  }) || []

  const weeklyTrendData = data?.weeklyTrend || []
  
  const revenueSeries = [
    { name: 'Revenue', color: '#3b82f6' },
    { name: 'Cost', color: '#f59e0b' },
  ]

  const topProductsData = data?.topProducts?.map((p: any) => ({
    label: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name,
    value: p.revenue
  })) || []

  const channelData = data?.salesByChannel?.map((ch: any) => ({
    label: ch.name,
    value: ch.revenue
  })) || []

  const filteredOrders = data?.recentOrders?.filter((order: any) => {
    const query = filterQuery.toLowerCase()
    return (
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    )
  }) || []

  return (
    <div className="space-y-6">
      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AL UMER MOBILE</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Premium Mobile & Accessories Store</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-blue-600 uppercase tracking-wider">
              Sales Performance Report
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">
              Period: {isCustomDate 
                ? `${startDate || 'N/A'} to ${endDate || 'N/A'}` 
                : timePeriod === 'week' ? 'This Week' 
                : timePeriod === 'month' ? 'This Month' 
                : timePeriod === 'quarter' ? 'This Quarter' 
                : timePeriod === 'year' ? 'This Year' : timePeriod.toUpperCase()}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Generated on: {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Sales Performance Report
          </h1>
          <p className="text-muted-foreground">
            Analyze revenue growth, conversion rates, and product sales metrics
          </p>
        </div>
        <div className="flex space-x-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Time & Date Range Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex bg-muted p-1 rounded-lg w-fit">
          {['week', 'month', 'quarter', 'year'].map((period) => (
            <Button
              key={period}
              variant={timePeriod === period && !isCustomDate ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setIsCustomDate(false)
                setTimePeriod(period)
                setStartDate('')
                setEndDate('')
              }}
              className="capitalize text-xs font-semibold px-3 py-1.5 h-8"
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period === 'quarter' ? 'This Quarter' : 'This Year'}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setIsCustomDate(true)
              }}
              className="text-xs border rounded-lg px-2 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 h-8 text-gray-900 border-gray-300"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setIsCustomDate(true)
              }}
              className="text-xs border rounded-lg px-2 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 h-8 text-gray-900 border-gray-300"
            />
          </div>
          {isCustomDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCustomDate(false)
                setStartDate('')
                setEndDate('')
                setTimePeriod('month')
              }}
              className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50 font-medium"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {loading || !data ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-muted/10 border rounded-xl border-dashed">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Generating report metrics from live DB...</p>
        </div>
      ) : (
        <>
          {/* Sales Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-l-4 border-l-blue-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales Revenue</CardTitle>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold">{formatCurrency(data.totalSales)}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1 text-xs">
                    {data.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={data.revenueGrowth >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth}%
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                  <Sparkline data={revenueSparkline} color="#3b82f6" width={80} height={28} />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-indigo-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ShoppingCart className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold">{formatNumber(data.totalOrders)}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1 text-xs">
                    {data.ordersGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={data.ordersGrowth >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {data.ordersGrowth >= 0 ? '+' : ''}{data.ordersGrowth}%
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                  <Sparkline data={ordersSparkline} color="#6366f1" width={80} height={28} />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-purple-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold">{formatCurrency(data.averageOrderValue)}</div>
                <div className="flex items-center space-x-1 text-xs mt-2">
                  {data.aovGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={data.aovGrowth >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                    {data.aovGrowth >= 0 ? '+' : ''}{data.aovGrowth}%
                  </span>
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-pink-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Store Conversion Rate</CardTitle>
                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold">{data.conversionRate !== undefined ? `${data.conversionRate}%` : '0%'}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1 text-xs">
                    {(data.conversionGrowth ?? 0) >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={(data.conversionGrowth ?? 0) >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {(data.conversionGrowth ?? 0) >= 0 ? '+' : ''}{data.conversionGrowth ?? 0}%
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2 print-new-page">
            <Card className="shadow-sm border border-border bg-white">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Daily Sales Trend</span>
                </CardTitle>
                <CardDescription>Revenue pattern across the period</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {dailyTrendData.length > 0 ? (
                  <AreaChart
                    data={dailyTrendData}
                    height={280}
                    color="#3b82f6"
                    curved={true}
                    showDots={dailyTrendData.length <= 15}
                    showLabels={true}
                  />
                ) : (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    No sales recorded for this period
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border bg-white">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <span>Revenue vs Cost</span>
                </CardTitle>
                <CardDescription>Weekly revenue compared to COGS</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {data.totalOrders > 0 ? (
                  <GroupedBarChart
                    data={weeklyTrendData}
                    series={revenueSeries}
                    height={280}
                    showGrid={true}
                  />
                ) : (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    No sales recorded for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-3 print-new-page">
            <Card className="lg:col-span-2 shadow-sm border border-border bg-white">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span>Top Products by Revenue</span>
                </CardTitle>
                <CardDescription>Best selling products by revenue contribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {topProductsData.length > 0 ? (
                  <BarChart
                    data={topProductsData}
                    height={260}
                    horizontal={true}
                    showValues={true}
                  />
                ) : (
                  <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
                    No product data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border bg-white">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <span>Sales Channels</span>
                </CardTitle>
                <CardDescription>Revenue distribution by channel</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <DonutChart
                  data={channelData}
                  height={260}
                  centerValue={formatNumber(data.totalOrders)}
                  centerLabel="Orders"
                  showLegend={false}
                />
                <div className="mt-4 space-y-2">
                  {data.salesByChannel.map((channel: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{
                          backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4'][idx % 3]
                        }} />
                        <span className="text-gray-600 font-medium">{channel.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{channel.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Log */}
          <Card className="shadow-sm border border-border bg-white print-new-page">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span>Recent Orders Log</span>
                  </CardTitle>
                  <CardDescription>
                    Detailed log of recent sales transactions
                  </CardDescription>
                </div>
                <div className="w-full sm:w-64 print:hidden">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Filter className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter Orders"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4 text-center">Items</th>
                      <th className="p-4 text-right">Order Total</th>
                      <th className="p-4 text-center">Date & Time</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-semibold text-blue-600">{order.id}</td>
                        <td className="p-4 font-medium">{order.customerName}</td>
                        <td className="p-4 text-center">{order.itemsCount} items</td>
                        <td className="p-4 text-right font-semibold">{formatCurrency(order.total)}</td>
                        <td className="p-4 text-center text-muted-foreground">{formatDate(order.time, 'PPp')}</td>
                        <td className="p-4 text-center">
                          <Badge className={
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }>
                            {order.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right print:hidden">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowInvoiceModal(true)
                            }}
                          >
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                          No recent sales orders found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <InvoicePreviewModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
      />
    </div>
  )
}

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
}

function InvoicePreviewModal({ isOpen, onClose, order }: InvoicePreviewModalProps) {
  if (!isOpen || !order) return null

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-area')
    const printWindow = window.open('', '_blank')
    if (printWindow && printContent) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
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
        <div className="p-6 overflow-y-auto flex-1" id="invoice-print-area">
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
              <p className="font-semibold mt-1">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-xs text-gray-500 mt-1">Phone: {order.customerPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-400 text-xs uppercase tracking-wider">Payment Info</p>
              <p className="font-semibold mt-1 uppercase">{order.paymentMethod || 'CASH'}</p>
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
                      <p className="text-[10px] text-gray-400 mt-0.5">SKU: {item.productSku}</p>
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
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}
