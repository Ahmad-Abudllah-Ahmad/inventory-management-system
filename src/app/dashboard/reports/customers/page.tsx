'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  TrendingUp,
  Printer,
  ChevronLeft,
  Search,
  Award
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { BarChart, DonutChart } from '@/components/ui/charts'

export default function CustomerReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [customDates, setCustomDates] = useState({ from: '', to: '' })
  const [searchTerm, setSearchTerm] = useState('')

  const loadReport = async () => {
    try {
      setLoading(true)
      let url = `/api/reports/customers?period=${selectedPeriod}`
      if (selectedPeriod === 'custom' && customDates.from && customDates.to) {
        url = `/api/reports/customers?startDate=${customDates.from}&endDate=${customDates.to}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load customer report', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [selectedPeriod, customDates.from, customDates.to])

  const handlePrint = () => {
    window.print()
  }

  const filteredCustomers = data?.allCustomers?.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  ) || []

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/reports" className="flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Reports
          </Link>
        </Button>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AL UMER MOBILE</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Premium Mobile & Accessories Store</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-blue-600 uppercase tracking-wider">Customer Analytics Report</h2>
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
            Customer Directory & Analytics
          </h1>
          <p className="text-muted-foreground">
            Detailed insights into customer registration, behavior, loyalty, and purchasing trends.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Filters (Time Period Selection) */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filter Time Period</CardTitle>
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
                size="sm"
              >
                This Week
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod('month')
                  setCustomDates({ from: '', to: '' })
                }}
                size="sm"
              >
                This Month
              </Button>
              <Button
                variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod('quarter')
                  setCustomDates({ from: '', to: '' })
                }}
                size="sm"
              >
                This Quarter
              </Button>
              <Button
                variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPeriod('year')
                  setCustomDates({ from: '', to: '' })
                }}
                size="sm"
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
                  size="sm"
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
                  className="px-3 py-1 text-xs border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
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
                  className="px-3 py-1 text-xs border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading || !data ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-muted/10 border rounded-xl border-dashed">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Generating customer report metrics...</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            <Card className="border-l-4 border-l-blue-600 shadow-sm animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.totalCustomers)}</div>
                <p className="text-xs text-muted-foreground">Registered in database</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 shadow-sm animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">+{formatNumber(data.newCustomers)}</div>
                <p className="text-xs text-muted-foreground">Created this period</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600 shadow-sm animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.repeatCustomers)}</div>
                <p className="text-xs text-muted-foreground">With 2+ orders</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-600 shadow-sm animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.averageSpent)}</div>
                <p className="text-xs text-muted-foreground">Per customer average</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span>Top Customers by Spend</span>
                </CardTitle>
                <CardDescription>Highest spending customer accounts</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <BarChart
                  data={data.topCustomers.map((c: any) => ({
                    label: c.name.split(' ')[0] || c.name,
                    value: c.spent,
                  }))}
                  height={280}
                  showValues={true}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Award className="w-5 h-5 text-pink-500" />
                  <span>Customer Segments</span>
                </CardTitle>
                <CardDescription>Ratio of new vs returning clients</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <DonutChart
                  data={[
                    { label: 'Repeat Customers', value: data.repeatCustomers, color: '#8b5cf6' },
                    { label: 'New Customers', value: data.newCustomers, color: '#06b6d4' },
                  ]}
                  height={280}
                  centerValue={String(data.totalCustomers)}
                  centerLabel="Total"
                />
              </CardContent>
            </Card>
          </div>

          {/* Customer Directory Table */}
          <Card className="shadow-sm print:shadow-none print:border-t">
            <CardHeader className="pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Customer Directory & Value Metrics</CardTitle>
                <CardDescription>Detailed transaction ledger for all customer accounts.</CardDescription>
              </div>
              <div className="relative w-full md:w-64 print:hidden">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                      <th className="p-4">Customer Details</th>
                      <th className="p-4 text-center">Total Orders</th>
                      <th className="p-4 text-right">Total Spent</th>
                      <th className="p-4 text-right">Loyalty Points</th>
                      <th className="p-4 text-right">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer: any) => (
                        <tr key={customer.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email} • {customer.phone}</p>
                          </td>
                          <td className="p-4 text-center font-medium">
                            {customer.orders}
                          </td>
                          <td className="p-4 text-right font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(customer.spent)}
                          </td>
                          <td className="p-4 text-right">
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 font-mono">
                              {formatNumber(customer.points)} pts
                            </Badge>
                          </td>
                          <td className="p-4 text-right text-muted-foreground text-xs">
                            {formatDate(customer.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No matching customer records found.
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
    </div>
  )
}
