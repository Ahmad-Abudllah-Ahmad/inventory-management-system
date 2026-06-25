'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  CheckCircle,
  XCircle,
  Truck,
  Printer,
  ChevronRight,
  Search
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { DonutChart, BarChart, AreaChart, Sparkline } from '@/components/ui/charts'

export default function InventoryReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [timePeriod, setTimePeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCustomDate, setIsCustomDate] = useState(false)

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        let url = `/api/reports/inventory?period=${timePeriod}`
        if (isCustomDate && startDate.length === 10 && endDate.length === 10) {
          url = `/api/reports/inventory?startDate=${startDate}&endDate=${endDate}`
        }
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to load inventory report', err)
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [timePeriod, isCustomDate, startDate, endDate])

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-muted/10 border rounded-xl border-dashed">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Generating report metrics from live DB...</p>
      </div>
    )
  }

  const stockTrendData = data.stockTrendData || []
  const stockLevelData = data.categories?.map((c: any) => ({
    label: c.name,
    value: c.productCount,
  })) || []

  const valuationSparkline = data.valuationSparkline || []

  const filteredCriticalStock = (data.criticalStock || []).filter((item: any) => {
    if (filterType === 'all') return true
    if (filterType === 'low') return item.status === 'LOW_STOCK'
    if (filterType === 'out') return item.status === 'OUT_OF_STOCK'
    return true
  })

  const filteredProducts = data?.allProducts?.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
              Inventory Valuation Report
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
            Inventory Status & Valuation
          </h1>
          <p className="text-muted-foreground">
            Monitor catalog value, stock levels, category weights, and critical low-stock items
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
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
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
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-600 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Valuation</CardTitle>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{formatCurrency(data.totalValue)}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500 font-medium">+{data.valueGrowth}%</span>
                <span>from last month</span>
              </div>
              <Sparkline data={valuationSparkline} color="#10b981" width={80} height={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Catalog Size</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{data.totalProducts} Items</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.activeProducts} currently active & featured
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alert</CardTitle>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-orange-600">{data.lowStockItems} Items</div>
            <p className="text-xs text-muted-foreground mt-2">
              Below minimum stock levels
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-red-600">{data.outOfStockItems} Items</div>
            <p className="text-xs text-muted-foreground mt-2">
              Zero stock - requires ordering
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 print-new-page">
        {/* Stock Valuation Trend */}
        <Card className="shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Stock Valuation Trend</span>
            </CardTitle>
            <CardDescription>Total inventory value over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {stockTrendData.length > 0 ? (
              <AreaChart
                data={stockTrendData}
                height={280}
                color="#10b981"
                curved={true}
                showDots={true}
                showLabels={true}
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products per Category Bar */}
        <Card className="shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-lg flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span>Products by Category</span>
            </CardTitle>
            <CardDescription>Number of products in each category</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {stockLevelData.length > 0 ? (
              <BarChart
                data={stockLevelData}
                height={280}
                showValues={true}
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                No products found in categories
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown & Restock Panel */}
      <div className="grid gap-6 lg:grid-cols-3 print-new-page">
        {/* Category Valuation Donut */}
        <Card className="lg:col-span-1 shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-lg flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <span>Valuation by Category</span>
            </CardTitle>
            <CardDescription>
              Inventory value distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {data.categories && data.categories.length > 0 ? (
              <>
                <DonutChart
                  data={data.categories.map((c: any) => ({
                    label: c.name,
                    value: c.value,
                    color: c.color,
                  }))}
                  height={280}
                  centerValue={formatCurrency(data.totalValue)}
                  centerLabel="Total Value"
                  showLegend={false}
                />
                {/* Inline legend */}
                <div className="mt-4 space-y-2">
                  {data.categories.map((cat: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-600 font-medium">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                No categories found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Stock Checklist */}
        <Card className="lg:col-span-2 shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Critical Stock Alerts</span>
                </CardTitle>
                <CardDescription>
                  Items requiring immediate purchase order generation
                </CardDescription>
              </div>
              <div className="flex bg-muted p-1 rounded-md text-xs print:hidden">
                <button 
                  onClick={() => setFilterType('all')} 
                  className={`px-2 py-1 rounded ${filterType === 'all' ? 'bg-white shadow font-medium' : 'text-muted-foreground'}`}
                >
                  All Alerts
                </button>
                <button 
                  onClick={() => setFilterType('low')} 
                  className={`px-2 py-1 rounded ${filterType === 'low' ? 'bg-white shadow font-medium' : 'text-muted-foreground'}`}
                >
                  Low Stock
                </button>
                <button 
                  onClick={() => setFilterType('out')} 
                  className={`px-2 py-1 rounded ${filterType === 'out' ? 'bg-white shadow font-medium' : 'text-muted-foreground'}`}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4 text-center">Current Stock</th>
                    <th className="p-4 text-center">Min Threshold</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCriticalStock.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{item.name}</td>
                      <td className="p-4 font-mono text-xs">{item.sku}</td>
                      <td className="p-4 text-center font-semibold text-red-600">{item.currentStock}</td>
                      <td className="p-4 text-center text-muted-foreground">{item.minStock}</td>
                      <td className="p-4 text-center">
                        <Badge className={
                          item.status === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }>
                          {item.status === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right print:hidden">
                        <Button size="sm" variant="outline" className="text-xs" asChild>
                          <Link href={`/dashboard/purchases?new=true&productId=${item.id}`}>
                            <Truck className="w-3.5 h-3.5 mr-1" />
                            Order Stock
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCriticalStock.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No critical stock issues matching filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complete Product Inventory & Valuation Table */}
      <Card className="shadow-sm border border-border bg-white print:shadow-none print:border-t mt-6 print-new-page">
        <CardHeader className="pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Product Inventory & Valuation Directory</CardTitle>
            <CardDescription>
              Comprehensive ledger of active products, cost details, and stock value.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64 print:hidden">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring text-gray-900 dark:text-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-muted-foreground font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Stock Count</th>
                  <th className="p-4 text-right">Cost Price</th>
                  <th className="p-4 text-right">Selling Price</th>
                  <th className="p-4 text-right">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((prod: any) => (
                    <tr key={prod.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{prod.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">SKU: {prod.sku}</p>
                      </td>
                      <td className="p-4 text-muted-foreground">{prod.category}</td>
                      <td className="p-4 text-center font-medium">
                        <span className={prod.currentStock <= prod.minStock ? 'text-red-600 font-semibold' : ''}>
                          {prod.currentStock}
                        </span>
                        <span className="text-xs text-muted-foreground"> / {prod.minStock}</span>
                      </td>
                      <td className="p-4 text-right font-mono">{formatCurrency(prod.costPrice)}</td>
                      <td className="p-4 text-right font-mono">{formatCurrency(prod.sellingPrice)}</td>
                      <td className="p-4 text-right font-semibold text-green-600 dark:text-green-400 font-mono">
                        {formatCurrency(prod.totalValue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No matching products found in report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
