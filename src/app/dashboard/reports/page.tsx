'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users,
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
  UserPlus,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, BarChart, DonutChart, Sparkline } from '@/components/ui/charts'
import Link from 'next/link'

export default function ReportsPage() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedReport, setSelectedReport] = useState('sales')
  const [customDates, setCustomDates] = useState({ from: '', to: '' })

  const { data: apiSalesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['salesReport', selectedPeriod, customDates.from, customDates.to],
    queryFn: async () => {
      let url = `/api/reports/sales?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && customDates.from && customDates.to) {
        url = `/api/reports/sales?startDate=${customDates.from}&endDate=${customDates.to}`;
      }
      const response = await fetch(url);
      return response.json();
    },
    refetchInterval: 30000,
  });

  const { data: apiInventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventoryReport', selectedPeriod, customDates.from, customDates.to],
    queryFn: async () => {
      let url = `/api/reports/inventory?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && customDates.from && customDates.to) {
        url = `/api/reports/inventory?startDate=${customDates.from}&endDate=${customDates.to}`;
      }
      const response = await fetch(url);
      return response.json();
    },
    refetchInterval: 30000,
  });

  const { data: apiCustomerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customerReport', selectedPeriod, customDates.from, customDates.to],
    queryFn: async () => {
      let url = `/api/reports/customers?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && customDates.from && customDates.to) {
        url = `/api/reports/customers?startDate=${customDates.from}&endDate=${customDates.to}`;
      }
      const response = await fetch(url);
      return response.json();
    },
    refetchInterval: 30000,
  });

  const salesData = {
    totalSales: apiSalesData?.totalSales || 0,
    totalOrders: apiSalesData?.totalOrders || 0,
    averageOrderValue: apiSalesData?.averageOrderValue || 0,
    growthRate: apiSalesData?.growthRate || 0,
    topProducts: apiSalesData?.topProducts || []
  }

  const inventoryData = {
    totalProducts: apiInventoryData?.totalProducts || 0,
    lowStockItems: apiInventoryData?.lowStockItems || 0,
    outOfStockItems: apiInventoryData?.outOfStockItems || 0,
    totalValue: apiInventoryData?.totalValue || 0,
    categories: apiInventoryData?.categories || []
  }

  const customerData = {
    totalCustomers: apiCustomerData?.totalCustomers || 0,
    newCustomers: apiCustomerData?.newCustomers || 0,
    repeatCustomers: apiCustomerData?.repeatCustomers || 0,
    averageSpent: apiCustomerData?.averageSpent || 0,
    topCustomers: apiCustomerData?.topCustomers || []
  }

  // Trend data for area charts
  const salesTrendData = apiSalesData?.dailyTrend?.length > 0
    ? apiSalesData.dailyTrend.map((d: any) => ({
        label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: d.revenue,
      }))
    : [
        { label: 'Week 1', value: 28000 },
        { label: 'Week 2', value: 32000 },
        { label: 'Week 3', value: 27000 },
        { label: 'Week 4', value: 38000 },
      ]

  const inventoryCategoryData = (inventoryData.categories || []).map((c: any) => ({
    label: c.name,
    value: c.value,
  }))

  const customerSpendData = (customerData.topCustomers || []).map((c: any) => ({
    label: c.name.split(' ')[0] || c.name,
    value: c.spent,
  }))

  // Sparkline data per report type
  const salesSparkline = [28, 32, 27, 38, 35, 42, 40]
  const inventorySparkline = [150, 148, 152, 156, 155, 158, 156]
  const customerSparkline = [75, 78, 80, 82, 85, 87, 89]

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
              {selectedReport === 'sales' && 'Sales Performance Report'}
              {selectedReport === 'inventory' && 'Inventory Valuation Report'}
              {selectedReport === 'customers' && 'Customer Analytics Report'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">
              Period: {selectedPeriod === 'custom' 
                ? `${customDates.from || 'N/A'} to ${customDates.to || 'N/A'}` 
                : selectedPeriod === 'week' ? 'This Week' 
                : selectedPeriod === 'month' ? 'This Month' 
                : selectedPeriod === 'quarter' ? 'This Quarter' 
                : selectedPeriod === 'year' ? 'This Year' : selectedPeriod.toUpperCase()}
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
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Print / Export Report
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button
              variant={selectedReport === 'sales' ? 'default' : 'outline'}
              onClick={() => setSelectedReport('sales')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Sales Report
            </Button>
            <Button
              variant={selectedReport === 'inventory' ? 'default' : 'outline'}
              onClick={() => setSelectedReport('inventory')}
            >
              <Package className="w-4 h-4 mr-2" />
              Inventory Report
            </Button>
            <Button
              variant={selectedReport === 'customers' ? 'default' : 'outline'}
              onClick={() => setSelectedReport('customers')}
            >
              <Users className="w-4 h-4 mr-2" />
              Customer Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod('week')
                  setCustomDates({ from: '', to: '' })
                }}
              >
                This Week
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod('month')
                  setCustomDates({ from: '', to: '' })
                }}
              >
                This Month
              </Button>
              <Button
                variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod('quarter')
                  setCustomDates({ from: '', to: '' })
                }}
              >
                This Quarter
              </Button>
              <Button
                variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod('year')
                  setCustomDates({ from: '', to: '' })
                }}
              >
                This Year
              </Button>
              {selectedPeriod === 'custom' && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedPeriod('month')
                    setCustomDates({ from: '', to: '' })
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  Clear Custom
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">From:</span>
                <input
                  type="date"
                  value={customDates.from}
                  onChange={(e) => {
                    setSelectedPeriod('custom')
                    setCustomDates(prev => ({ ...prev, from: e.target.value }))
                  }}
                  className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">To:</span>
                <input
                  type="date"
                  value={customDates.to}
                  onChange={(e) => {
                    setSelectedPeriod('custom')
                    setCustomDates(prev => ({ ...prev, to: e.target.value }))
                  }}
                  className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {selectedReport === 'sales' && (
          <>
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData.totalSales)}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{salesData.growthRate}%</span>
                    <span>from last period</span>
                  </div>
                  <Sparkline data={salesSparkline} color="#3b82f6" width={80} height={28} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-indigo-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(salesData.totalOrders)}</div>
                <p className="text-xs text-muted-foreground">Orders processed</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">Per order</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">+{salesData.growthRate}%</div>
                <p className="text-xs text-muted-foreground">vs last period</p>
              </CardContent>
            </Card>
          </>
        )}

        {selectedReport === 'inventory' && (
          <>
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(inventoryData.totalProducts)}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Active products</p>
                  <Sparkline data={inventorySparkline} color="#6366f1" width={80} height={28} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{formatNumber(inventoryData.lowStockItems)}</div>
                <p className="text-xs text-muted-foreground">Need restocking</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-red-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{formatNumber(inventoryData.outOfStockItems)}</div>
                <p className="text-xs text-muted-foreground">Zero stock</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(inventoryData.totalValue)}</div>
                <p className="text-xs text-muted-foreground">Total stock value</p>
              </CardContent>
            </Card>
          </>
        )}

        {selectedReport === 'customers' && (
          <>
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(customerData.totalCustomers)}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Registered customers</p>
                  <Sparkline data={customerSparkline} color="#8b5cf6" width={80} height={28} />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">+{formatNumber(customerData.newCustomers)}</div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(customerData.repeatCustomers)}</div>
                <p className="text-xs text-muted-foreground">Returning customers</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-indigo-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(customerData.averageSpent)}</div>
                <p className="text-xs text-muted-foreground">Per customer</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ─── Charts Section ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {selectedReport === 'sales' && (
          <>
            {/* Sales Trend Area Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Sales Revenue Trend</span>
                </CardTitle>
                <CardDescription>Revenue over selected time period</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <AreaChart
                  data={salesTrendData}
                  height={280}
                  color="#3b82f6"
                  curved={true}
                  showDots={true}
                  showLabels={true}
                />
              </CardContent>
            </Card>

            {/* Top Products Bar Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <span>Top Products by Revenue</span>
                </CardTitle>
                <CardDescription>Best performing products</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <BarChart
                  data={salesData.topProducts.map((p: any) => ({
                    label: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
                    value: p.revenue,
                  }))}
                  height={280}
                  horizontal={true}
                  showValues={true}
                />
              </CardContent>
            </Card>
          </>
        )}

        {selectedReport === 'inventory' && (
          <>
            {/* Inventory Category Donut */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-violet-500" />
                  <span>Inventory by Category</span>
                </CardTitle>
                <CardDescription>Stock value distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <DonutChart
                  data={inventoryCategoryData}
                  height={280}
                  centerValue={formatCurrency(inventoryData.totalValue)}
                  centerLabel="Total Value"
                />
              </CardContent>
            </Card>

            {/* Category Stock Count Bar Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  <span>Products per Category</span>
                </CardTitle>
                <CardDescription>Product count distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <BarChart
                  data={inventoryData.categories.map((c: any) => ({
                    label: c.name,
                    value: c.productCount,
                  }))}
                  height={280}
                  showValues={true}
                />
              </CardContent>
            </Card>
          </>
        )}

        {selectedReport === 'customers' && (
          <>
            {/* Top Customers Bar Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span>Top Customers by Spend</span>
                </CardTitle>
                <CardDescription>Highest spending customers</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <BarChart
                  data={customerSpendData}
                  height={280}
                  showValues={true}
                />
              </CardContent>
            </Card>

            {/* Customer Orders Donut */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-pink-500" />
                  <span>Customer Segments</span>
                </CardTitle>
                <CardDescription>New vs Repeat customers</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <DonutChart
                  data={[
                    { label: 'Repeat Customers', value: customerData.repeatCustomers, color: '#8b5cf6' },
                    { label: 'New Customers', value: customerData.newCustomers, color: '#06b6d4' },
                  ]}
                  height={280}
                  centerValue={String(customerData.totalCustomers)}
                  centerLabel="Total"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Detailed Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedReport === 'sales' && 'Top Selling Products'}
                {selectedReport === 'inventory' && 'Inventory by Category'}
                {selectedReport === 'customers' && 'Top Customers'}
              </CardTitle>
              <CardDescription>
                {selectedReport === 'sales' && 'Best performing products by revenue'}
                {selectedReport === 'inventory' && 'Product distribution across categories'}
                {selectedReport === 'customers' && 'Highest spending customers'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="print:hidden" asChild>
              <Link href={`/dashboard/reports/${selectedReport}`}>
                View Full Report
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedReport === 'sales' && salesData.topProducts?.map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.unitsSold} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-muted-foreground">{product.unitsSold} sales</p>
                </div>
              </div>
            ))}

            {selectedReport === 'inventory' && inventoryData.categories?.map((category: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.productCount} products</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(category.value)}</p>
                  <p className="text-sm text-muted-foreground">{category.productCount} items</p>
                </div>
              </div>
            ))}

            {selectedReport === 'customers' && customerData.topCustomers?.map((customer: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(customer.spent)}</p>
                  <p className="text-sm text-muted-foreground">{customer.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}