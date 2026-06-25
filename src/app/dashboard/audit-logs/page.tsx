'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {

  Search,
  Clock,
  ShieldAlert,
  Terminal,
  Database,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Server,
  Activity,
  Layers
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts'

interface AuditLog {
  id: string
  userId: string | null
  action: string
  resource: string
  resourceId: string | null
  oldValues: any
  newValues: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    name: string
    username: string
    role: string
  }
}

const RESOURCE_TAGS: Record<string, { label: string; className: string }> = {
  AUTH: { label: '[AUTH]', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  PRODUCT: { label: '[PRODUCT]', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
  SALE: { label: '[SALE]', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  PURCHASE: { label: '[PURCHASE]', className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
  CUSTOMER: { label: '[CUSTOMER]', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  BRAND: { label: '[BRAND]', className: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800' },
  CATEGORY: { label: '[CATEGORY]', className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800' },
  SUPPLIER: { label: '[SUPPLIER]', className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800' },
  USER: { label: '[USER]', className: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800' },
}

const getResourceTag = (resource: string) => {
  return RESOURCE_TAGS[resource] || {
    label: `[${resource}]`,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
  }
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', className: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-800' },
  ADMIN: { label: 'Admin', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800' },
  MANAGER: { label: 'Manager', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800' },
  STAFF: { label: 'Staff', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800' },
  SYSTEM: { label: 'System', className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800' },
}

const RESOURCE_COLORS: Record<string, string> = {
  AUTH: '#EF4444',
  PRODUCT: '#10B981',
  SALE: '#3B82F6',
  PURCHASE: '#8B5CF6',
  CUSTOMER: '#F59E0B',
  BRAND: '#EC4899',
  CATEGORY: '#06B6D4',
  SUPPLIER: '#14B8A6',
  USER: '#6366F1',
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#EC4899',
  ADMIN: '#EF4444',
  MANAGER: '#F59E0B',
  STAFF: '#3B82F6',
  SYSTEM: '#6B7280',
}

function LogDetails({ oldValues, newValues }: { oldValues: any; newValues: any }) {
  if (!oldValues && !newValues) return null

  const getDiff = () => {
    if (!oldValues || !newValues) return null
    try {
      const oldObj = typeof oldValues === 'string' ? JSON.parse(oldValues) : oldValues
      const newObj = typeof newValues === 'string' ? JSON.parse(newValues) : newValues

      const diffs: { field: string; oldVal: string; newVal: string }[] = []
      const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]))

      for (const key of allKeys) {
        if (['createdAt', 'updatedAt', 'password', 'lastLogin'].includes(key)) continue

        const oldVal = oldObj?.[key]
        const newVal = newObj?.[key]

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          diffs.push({
            field: key,
            oldVal: oldVal !== undefined && oldVal !== null ? (typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)) : '(none)',
            newVal: newVal !== undefined && newVal !== null ? (typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)) : '(none)',
          })
        }
      }
      return diffs
    } catch (e) {
      return null
    }
  }

  const diffs = getDiff()

  return (
    <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-mono space-y-4">
      {diffs && diffs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-850">
            <thead>
              <tr>
                <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Before</th>
                <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {diffs.map(d => (
                <tr key={d.field}>
                  <td className="px-3 py-1.5 font-bold text-gray-700 dark:text-gray-300">{d.field}</td>
                  <td className="px-3 py-1.5 text-red-600 bg-red-50/50 dark:bg-red-950/10 dark:text-red-400 break-all">{d.oldVal}</td>
                  <td className="px-3 py-1.5 text-green-600 bg-green-50/50 dark:bg-green-950/10 dark:text-green-400 break-all">{d.newVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {oldValues && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-400 mb-1">Raw Data (Before)</div>
            <pre className="p-3 bg-white dark:bg-gray-950 border rounded max-h-48 overflow-y-auto break-all whitespace-pre-wrap text-gray-600 dark:text-gray-300">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          </div>
        )}
        {newValues && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-gray-400 mb-1">Raw Data (After)</div>
            <pre className="p-3 bg-white dark:bg-gray-950 border rounded max-h-48 overflow-y-auto break-all whitespace-pre-wrap text-gray-600 dark:text-gray-300">
              {JSON.stringify(newValues, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuditLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [resourceFilter, setResourceFilter] = useState('ALL')

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/audit-logs')
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to fetch audit logs')
      }
      const json = await res.json()
      if (json.success && json.data) {
        setLogs(json.data)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred while loading audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    fetchLogs()
  }, [])

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only Super Administrators can view system audit logs.</p>
      </div>
    )
  }

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const role = log.user?.role || 'SYSTEM'
    const matchesRole = roleFilter === 'ALL' || role === roleFilter
    const matchesResource = resourceFilter === 'ALL' || log.resource === resourceFilter

    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchLower) ||
      log.resource.toLowerCase().includes(searchLower) ||
      (log.user?.name || '').toLowerCase().includes(searchLower) ||
      (log.user?.username || '').toLowerCase().includes(searchLower) ||
      (log.ipAddress || '').toLowerCase().includes(searchLower) ||
      (log.userAgent || '').toLowerCase().includes(searchLower) ||
      JSON.stringify(log.oldValues || '').toLowerCase().includes(searchLower) ||
      JSON.stringify(log.newValues || '').toLowerCase().includes(searchLower)

    return matchesRole && matchesResource && matchesSearch
  })

  // Prepare stats
  const totalLogsCount = filteredLogs.length
  const authLogsCount = filteredLogs.filter(l => l.resource === 'AUTH').length
  const saleLogsCount = filteredLogs.filter(l => l.resource === 'SALE').length
  const productLogsCount = filteredLogs.filter(l => l.resource === 'PRODUCT').length

  // Role Chart Data
  const roleCounts: Record<string, number> = {
    SUPER_ADMIN: 0,
    ADMIN: 0,
    MANAGER: 0,
    STAFF: 0,
    SYSTEM: 0,
  }
  filteredLogs.forEach(log => {
    const role = log.user?.role || 'SYSTEM'
    const current = roleCounts[role]
    if (typeof current === 'number') {
      roleCounts[role] = current + 1
    } else {
      const systemVal = roleCounts.SYSTEM ?? 0
      roleCounts.SYSTEM = systemVal + 1
    }
  })
  const roleChartData = Object.keys(roleCounts).map(role => ({
    name: role.replace('_', ' '),
    count: roleCounts[role] ?? 0,
    color: ROLE_COLORS[role] || '#6B7280',
  }))

  // Resource Chart Data
  const resourceCounts: Record<string, number> = {}
  filteredLogs.forEach(log => {
    const res = log.resource
    const currentVal = resourceCounts[res] ?? 0
    resourceCounts[res] = currentVal + 1
  })
  const resourceChartData = Object.keys(resourceCounts).map(res => ({
    name: res,
    value: resourceCounts[res] ?? 0,
    color: RESOURCE_COLORS[res] || '#6B7280',
  }))

  // Trend Chart Data (logs by day)
  const trendCounts: Record<string, number> = {}
  filteredLogs.forEach(log => {
    try {
      const dateObj = new Date(log.createdAt)
      const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
      const val = trendCounts[label] ?? 0
      trendCounts[label] = val + 1
    } catch (e) { }
  })
  const trendChartData = Object.keys(trendCounts)
    .map(dateStr => {
      const parts = dateStr.split('/')
      const monthStr = parts[0] || '1'
      const dayStr = parts[1] || '1'
      return {
        dateStr,
        month: parseInt(monthStr, 10),
        day: parseInt(dayStr, 10),
        count: trendCounts[dateStr] ?? 0
      }
    })
    .sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month
      return a.day - b.day
    })
    .map(item => ({
      date: item.dateStr,
      Count: item.count
    }))

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor and audit all real-time activities across system roles and resources.
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogsCount}</div>
            <p className="text-xs text-muted-foreground">Matching current filters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Events</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authLogsCount}</div>
            <p className="text-xs text-muted-foreground">Logins and sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales POS logs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saleLogsCount}</div>
            <p className="text-xs text-muted-foreground">POS transaction logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Lifecycle</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productLogsCount}</div>
            <p className="text-xs text-muted-foreground">Create, edit, delete product logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      {isMounted && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity by User Role</CardTitle>
              <CardDescription>Actions performed by each system role</CardDescription>
            </CardHeader>
            <CardContent className="h-[240px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={30} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {roleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity by Resource Type</CardTitle>
              <CardDescription>Distribution of events across components</CardDescription>
            </CardHeader>
            <CardContent className="h-[240px] flex items-center justify-center">
              {resourceChartData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data to display</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {resourceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity Trend</CardTitle>
              <CardDescription>Number of logs recorded over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[240px] flex items-center justify-center">
              {trendChartData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No trend data to display</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={30} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Count" stroke="#3B82F6" fillOpacity={0.15} fill="url(#colorCount)" />
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            Log Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search username, action, content, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground text-sm h-10 border-input shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin Only</option>
              <option value="ADMIN">Admin Only</option>
              <option value="MANAGER">Manager Only</option>
              <option value="STAFF">Staff Only</option>
              <option value="SYSTEM">System events Only</option>
            </select>

            {/* Resource Filter */}
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground text-sm h-10 border-input shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Resources</option>
              <option value="AUTH">Authentication (AUTH)</option>
              <option value="PRODUCT">Products (PRODUCT)</option>
              <option value="SALE">Sales Transaction (SALE)</option>
              <option value="PURCHASE">Purchase Order (PURCHASE)</option>
              <option value="CUSTOMER">Customers (CUSTOMER)</option>
              <option value="BRAND">Brands (BRAND)</option>
              <option value="CATEGORY">Categories (CATEGORY)</option>
              <option value="SUPPLIER">Suppliers (SUPPLIER)</option>
              <option value="USER">User Management (USER)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Chronological List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log Timeline</CardTitle>
          <CardDescription>
            Chronological audit log records of all system actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Loading audit records...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p className="font-semibold">Error Loading Logs</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-semibold">No audit logs found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id
                const resourceTag = getResourceTag(log.resource)
                const userRole = log.user?.role || 'SYSTEM'
                const roleBadge = ROLE_BADGES[userRole] || { label: userRole, className: 'bg-gray-50 text-gray-700 border-gray-205 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800' }

                return (
                  <div
                    key={log.id}
                    className="p-4 border rounded-xl bg-white dark:bg-gray-950 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all border-gray-200 dark:border-gray-800 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Badges & Description */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Resource Badge Tag */}
                        <div className="flex-shrink-0">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${resourceTag.className}`}>
                            {resourceTag.label}
                          </span>
                        </div>

                        {/* Event Information */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white uppercase text-sm tracking-wide">
                              {log.action.replace('_', ' ')}
                            </span>
                            <span className="text-gray-400 text-xs">•</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              By {log.user?.name}
                            </span>
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border ${roleBadge.className}`}>
                              {roleBadge.label}
                            </span>
                          </div>

                          {/* Client details (IP, Agent, etc) */}
                          <div className="flex items-center flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(log.createdAt)}</span>
                            </div>
                            {log.ipAddress && (
                              <div className="flex items-center gap-1">
                                <Terminal className="w-3 h-3" />
                                <span>IP: {log.ipAddress}</span>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="flex items-center gap-1 max-w-xs md:max-w-md truncate" title={log.userAgent}>
                                <Info className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">Browser: {log.userAgent}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Expand details action */}
                      <div className="flex items-center justify-end flex-shrink-0">
                        {(log.oldValues || log.newValues) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(log.id)}
                            className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                          >
                            {isExpanded ? (
                              <>
                                Hide Details
                                <ChevronUp className="w-4 h-4 ml-1.5" />
                              </>
                            ) : (
                              <>
                                View Details
                                <ChevronDown className="w-4 h-4 ml-1.5" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible details pane */}
                    {isExpanded && (log.oldValues || log.newValues) && (
                      <LogDetails oldValues={log.oldValues} newValues={log.newValues} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
