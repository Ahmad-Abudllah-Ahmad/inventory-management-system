'use client'

import { useState, useEffect } from 'react'
import { Oswald } from 'next/font/google'
const oswald = Oswald({ subsets: ['latin'], weight: ['200', '700'] })
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  Percent,
  Calculator,
  Briefcase,
  Printer,
  ChevronRight,
  TrendingUp as ProfitIcon
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { GroupedBarChart, DonutChart, AreaChart, MultiLineChart, Sparkline } from '@/components/ui/charts'

const financialSeries = [
  { name: 'Revenue', color: '#10b981' },
  { name: 'COGS', color: '#f59e0b' },
  { name: 'Profit', color: '#3b82f6' },
]

export default function FinancialReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCustomDate, setIsCustomDate] = useState(false)

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        let url = `/api/reports/financial?period=${timePeriod}`
        if (isCustomDate && startDate.length === 10 && endDate.length === 10) {
          url = `/api/reports/financial?startDate=${startDate}&endDate=${endDate}`
        }
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to load financial report', err)
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [timePeriod, isCustomDate, startDate, endDate])

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-muted/10 border rounded-xl border-dashed">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Generating financial metrics from live DB...</p>
      </div>
    )
  }

  const stats = data.stats || {}
  const expenses = data.expenses || []
  const revenueVsCostTrend = data.revenueVsCostTrend || []
  const profitTrendData = data.profitTrendData || []
  const monthlyBreakdown = data.monthlyBreakdown || []
  const revenueSparkline = data.revenueSparkline || []
  const profitSparkline = data.profitSparkline || []

  return (
    <div className="space-y-6">
      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl text-gray-900 ${oswald.className}`} style={{ fontWeight: 200, textTransform: 'none' }}>fourty<span style={{ fontWeight: 700 }}>1</span></h1>
            <p className="text-xs text-muted-foreground mt-0.5">Premium Mobile & Accessories Store</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-emerald-600 uppercase tracking-wider">
              Financial Health Report
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Financial Health & Profitability
          </h1>
          <p className="text-muted-foreground">
            Track gross margins, Net Income, Cost of Goods Sold (COGS), and tax estimations
          </p>
        </div>
        <div className="flex space-x-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
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

      {/* Key Financial Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">+{stats.monthlyChange}%</span>
                <span>from last month</span>
              </div>
              <Sparkline data={revenueSparkline} color="#10b981" width={80} height={28} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cost of Goods Sold</CardTitle>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
              <Calculator className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.cogs)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Value of inventory sold
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit Margin</CardTitle>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-teal-600">{stats.grossMargin}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Gross Profit: {formatCurrency(stats.grossProfit)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. Net Profit</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.netProfit)}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Margin: {stats.netMargin}%
              </p>
              <Sparkline data={profitSparkline} color="#3b82f6" width={80} height={28} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 print-new-page">
        {/* Revenue vs COGS vs Profit Grouped Bar */}
        <Card className="shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-lg flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span>Revenue, COGS & Profit</span>
            </CardTitle>
            <CardDescription>Monthly financial comparison</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <GroupedBarChart
              data={revenueVsCostTrend}
              series={financialSeries}
              height={300}
              showGrid={true}
            />
          </CardContent>
        </Card>

        {/* Profit Trend Area Chart */}
        <Card className="shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Gross Profit Trend</span>
            </CardTitle>
            <CardDescription>Profit growth over recent months</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <AreaChart
              data={profitTrendData}
              height={300}
              color="#3b82f6"
              curved={true}
              showDots={true}
              showLabels={true}
              showValues={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Expense Distribution & P&L Table */}
      <div className="grid gap-6 lg:grid-cols-3 print-new-page">
        {/* Expense Distribution Donut */}
        <Card className="shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-teal-500" />
              <span>Expense Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown of outgoing expenses</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <DonutChart
              data={expenses.map((e: any) => ({
                label: e.category,
                value: e.amount,
                color: e.color,
              }))}
              height={280}
              centerValue={formatCurrency(expenses.reduce((s: number, e: any) => s + e.amount, 0))}
              centerLabel="Total Expenses"
              showLegend={false}
            />
            {/* Inline legend */}
            <div className="mt-4 space-y-2">
              {expenses.map((exp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: exp.color }} />
                    <span className="text-gray-600 font-medium truncate max-w-[150px]">{exp.category}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{exp.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly P&L Statement */}
        <Card className="lg:col-span-2 shadow-sm border border-border bg-white">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-lg flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span>Monthly P&L Summary</span>
            </CardTitle>
            <CardDescription>
              Comparison of revenue, cost of goods, and margins over time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Month</th>
                    <th className="p-4 text-right">Revenue</th>
                    <th className="p-4 text-right">COGS (Expenses)</th>
                    <th className="p-4 text-right">Gross Profit</th>
                    <th className="p-4 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyBreakdown.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-semibold text-gray-800">{row.month}</td>
                      <td className="p-4 text-right font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                      <td className="p-4 text-right text-red-600">{formatCurrency(row.cogs)}</td>
                      <td className="p-4 text-right font-semibold text-green-600">{formatCurrency(row.grossProfit)}</td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-teal-700">{row.margin}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Estimations Note */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Tax Estimations Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-emerald-700 leading-relaxed">
            The tax liabilities displayed here are estimates based on a standard sales tax rate of 17.0% (PKR rules). 
            Gross Margin does not account for operating overhead costs such as storefront rent, power grid costs, or employee salaries. 
            For exact tax filings, please use the financial ledger export tool or consult with the company's designated accountant.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
