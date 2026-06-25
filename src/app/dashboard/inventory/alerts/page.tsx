'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import toast from 'react-hot-toast'
import { CreateAlertModal } from '@/components/inventory/create-alert-modal'
import { RestockModal, NotificationSettingsModal, AlertHistoryModal } from '@/components/inventory/alert-actions-modals'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Filter,
  Download,
  Bell,
  Eye,
  Edit,
  Plus
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface StockAlert {
  id: string
  productId: string
  productName: string
  sku: string
  category: string
  brand?: string
  currentStock: number
  minStockLevel: number
  maxStockLevel?: number
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'EXPIRY_WARNING'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  isRead: boolean
  isActive: boolean
  createdAt: string
  lastUpdated: string
}

export default function StockAlertsPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [alertTypeFilter, setAlertTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRestock, setShowRestock] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [viewingAlert, setViewingAlert] = useState<StockAlert | null>(null)
  const [editingAlert, setEditingAlert] = useState<StockAlert | null>(null)
  const [editThreshold, setEditThreshold] = useState<number>(0)

  const handleExport = () => {
    const csvRows = [
      ['Product Name', 'SKU', 'Category', 'Type', 'Priority', 'Message', 'Stock', 'Date']
    ]
    filteredAlerts.forEach(a => {
      csvRows.push([
        `"${a.productName}"`, 
        `"${a.sku}"`, 
        `"${a.category}"`, 
        a.alertType, 
        a.priority, 
        `"${a.message.replace(/"/g, '""')}"`, 
        a.currentStock.toString(), 
        new Date(a.createdAt).toLocaleDateString()
      ])
    })
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `stock_alerts_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report exported successfully!')
  }

  // Mock data for demonstration
  const mockAlerts: StockAlert[] = [
    {
      id: '1',
      productId: '1',
      productName: 'iPhone 14 Pro Case - Clear',
      sku: 'CASE-IP14P-CLR',
      category: 'Cases',
      brand: 'Apple',
      currentStock: 2,
      minStockLevel: 10,
      maxStockLevel: 50,
      alertType: 'LOW_STOCK',
      priority: 'HIGH',
      message: 'Stock level is critically low. Only 2 units remaining.',
      isRead: false,
      isActive: true,
      createdAt: '2024-01-15T10:30:00Z',
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      productId: '2',
      productName: 'Samsung A54 Tempered Glass',
      sku: 'GLASS-SA54-TEMP',
      category: 'Screen Protectors',
      brand: 'Samsung',
      currentStock: 1,
      minStockLevel: 20,
      maxStockLevel: 100,
      alertType: 'LOW_STOCK',
      priority: 'HIGH',
      message: 'Stock level is critically low. Only 1 unit remaining.',
      isRead: false,
      isActive: true,
      createdAt: '2024-01-15T11:15:00Z',
      lastUpdated: '2024-01-15T11:15:00Z'
    },
    {
      id: '3',
      productId: '3',
      productName: 'Power Bank 20000mAh',
      sku: 'PWR-20K-MAH',
      category: 'Power Banks',
      brand: 'Anker',
      currentStock: 3,
      minStockLevel: 15,
      maxStockLevel: 30,
      alertType: 'LOW_STOCK',
      priority: 'MEDIUM',
      message: 'Stock level is below minimum threshold.',
      isRead: true,
      isActive: true,
      createdAt: '2024-01-15T12:00:00Z',
      lastUpdated: '2024-01-15T12:00:00Z'
    },
    {
      id: '4',
      productId: '4',
      productName: 'USB-C Cable 2m',
      sku: 'CABLE-USBC-2M',
      category: 'Cables',
      brand: 'Belkin',
      currentStock: 0,
      minStockLevel: 25,
      maxStockLevel: 100,
      alertType: 'OUT_OF_STOCK',
      priority: 'HIGH',
      message: 'Product is completely out of stock.',
      isRead: false,
      isActive: true,
      createdAt: '2024-01-15T13:45:00Z',
      lastUpdated: '2024-01-15T13:45:00Z'
    },
    {
      id: '5',
      productId: '5',
      productName: 'Wireless Earbuds Pro',
      sku: 'EARBUDS-WIRELESS-PRO',
      category: 'Audio',
      brand: 'Sony',
      currentStock: 12,
      minStockLevel: 8,
      maxStockLevel: 25,
      alertType: 'OVERSTOCK',
      priority: 'LOW',
      message: 'Stock level is approaching maximum capacity.',
      isRead: true,
      isActive: true,
      createdAt: '2024-01-15T14:20:00Z',
      lastUpdated: '2024-01-15T14:20:00Z'
    }
  ]

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stock-alerts?limit=100')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setAlerts(data.data)
        } else {
          setAlerts(mockAlerts)
        }
      } else {
        setAlerts(mockAlerts)
      }
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error)
      setAlerts(mockAlerts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleMarkResolved = async (alertId: string) => {
    // For mock/demo alerts, resolve locally
    if (['1', '2', '3', '4', '5'].includes(alertId)) {
      toast.success('Stock alert marked as resolved (demo)')
      setAlerts(prev => prev.filter(a => a.id !== alertId))
      return
    }

    try {
      const res = await fetch(`/api/stock-alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true, isActive: false }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          toast.success('Stock alert marked as resolved')
          setAlerts(prev => prev.filter(a => a.id !== alertId))
        } else {
          toast.error(data.error || 'Failed to resolve alert')
        }
      } else {
        toast.error('Failed to resolve alert')
      }
    } catch (error) {
      console.error('Failed to resolve stock alert:', error)
      toast.error('Error resolving stock alert')
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = alertTypeFilter === 'all' || alert.alertType === alertTypeFilter
    const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'unread' && !alert.isRead) ||
                         (statusFilter === 'read' && alert.isRead)
    return matchesSearch && matchesType && matchesPriority && matchesStatus
  })

  const stats = {
    totalAlerts: alerts.length,
    unreadAlerts: alerts.filter(a => !a.isRead).length,
    highPriorityAlerts: alerts.filter(a => a.priority === 'HIGH').length,
    lowStockAlerts: alerts.filter(a => a.alertType === 'LOW_STOCK').length,
    outOfStockAlerts: alerts.filter(a => a.alertType === 'OUT_OF_STOCK').length
  }

  const getAlertTypeBadge = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>
      case 'OUT_OF_STOCK':
        return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
      case 'OVERSTOCK':
        return <Badge className="bg-blue-100 text-blue-800">Overstock</Badge>
      case 'EXPIRY_WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800">Expiry Warning</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>
    }
  }

  const getStockStatus = (alert: StockAlert) => {
    if (alert.currentStock === 0) {
      return { status: 'Out of Stock', color: 'red', icon: XCircle }
    }
    if (alert.currentStock <= alert.minStockLevel) {
      return { status: 'Low Stock', color: 'orange', icon: AlertTriangle }
    }
    if (alert.maxStockLevel && alert.currentStock >= alert.maxStockLevel) {
      return { status: 'Overstock', color: 'blue', icon: TrendingUp }
    }
    return { status: 'Normal', color: 'green', icon: CheckCircle }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Alerts</h1>
          <p className="text-muted-foreground">
            Monitor inventory levels and stock alerts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => {
            // TODO: Implement export functionality
            alert('Export functionality will be implemented')
          }}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions for managing stock alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => setShowRestock(true)}>
              <Package className="w-6 h-6 mb-2" />
              <span>Restock Items</span>
              <span className="text-xs text-muted-foreground">Add inventory</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" onClick={handleExport}>
              <Download className="w-6 h-6 mb-2" />
              <span>Export Report</span>
              <span className="text-xs text-muted-foreground">Download alerts</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" onClick={() => setShowSettings(true)}>
              <Bell className="w-6 h-6 mb-2" />
              <span>Notification Settings</span>
              <span className="text-xs text-muted-foreground">Configure alerts</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col" onClick={() => setShowHistory(true)}>
              <Clock className="w-6 h-6 mb-2" />
              <span>Alert History</span>
              <span className="text-xs text-muted-foreground">View past alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">All alerts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.unreadAlerts}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.highPriorityAlerts}</div>
            <p className="text-xs text-muted-foreground">Critical alerts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.outOfStockAlerts}</div>
            <p className="text-xs text-muted-foreground">Zero stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Types</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="OVERSTOCK">Overstock</option>
              <option value="EXPIRY_WARNING">Expiry Warning</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>
            Active inventory alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alerts found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const stockStatus = getStockStatus(alert)
                const StatusIcon = stockStatus.icon
                
                return (
                  <div key={alert.id} className={`flex items-center justify-between p-4 border rounded-lg ${!alert.isRead ? 'bg-orange-50 border-orange-200' : ''}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        stockStatus.color === 'red' ? 'bg-red-600' :
                        stockStatus.color === 'orange' ? 'bg-orange-600' :
                        stockStatus.color === 'blue' ? 'bg-blue-600' :
                        'bg-green-600'
                      }`}>
                        <StatusIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{alert.productName}</p>
                          {getAlertTypeBadge(alert.alertType)}
                          {getPriorityBadge(alert.priority)}
                          {!alert.isRead && (
                            <Badge className="bg-orange-100 text-orange-800">New</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center space-x-1">
                            <Package className="w-3 h-3" />
                            <span>{alert.sku}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>{alert.category}</span>
                          </div>
                          {alert.brand && (
                            <div className="flex items-center space-x-1">
                              <span>{alert.brand}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
                            {stockStatus.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.currentStock} in stock (min: {alert.minStockLevel})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setViewingAlert(alert)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingAlert(alert)
                          setEditThreshold(alert.minStockLevel)
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleMarkResolved(alert.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAlertModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={fetchAlerts} 
      />
      <RestockModal isOpen={showRestock} onClose={() => setShowRestock(false)} onSuccess={fetchAlerts} />
      <NotificationSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <AlertHistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />

      {/* View Alert Details Modal */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Alert Details</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingAlert(null)} className="rounded-full">
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="font-semibold block text-xs uppercase text-muted-foreground">Product</span>
                <p className="text-base font-medium">{viewingAlert.productName}</p>
                <p className="text-xs text-muted-foreground">{viewingAlert.sku} • {viewingAlert.category}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold block text-xs uppercase text-muted-foreground">Alert Type</span>
                  <div className="mt-1">{getAlertTypeBadge(viewingAlert.alertType)}</div>
                </div>
                <div>
                  <span className="font-semibold block text-xs uppercase text-muted-foreground">Priority</span>
                  <div className="mt-1">{getPriorityBadge(viewingAlert.priority)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold block text-xs uppercase text-muted-foreground">Current Stock</span>
                  <p className="text-base font-semibold">{viewingAlert.currentStock} units</p>
                </div>
                <div>
                  <span className="font-semibold block text-xs uppercase text-muted-foreground">Alert Threshold</span>
                  <p className="text-base font-semibold">{viewingAlert.minStockLevel} units</p>
                </div>
              </div>
              <div>
                <span className="font-semibold block text-xs uppercase text-muted-foreground">Alert Message</span>
                <p className="bg-muted p-3 rounded-lg mt-1 text-xs">{viewingAlert.message}</p>
              </div>
              <div>
                <span className="font-semibold block text-xs uppercase text-muted-foreground">Date Triggered</span>
                <p className="mt-1">{new Date(viewingAlert.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setViewingAlert(null)}>Close</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                handleMarkResolved(viewingAlert.id)
                setViewingAlert(null)
              }}>
                Mark Resolved
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Alert Threshold Modal */}
      {editingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Edit Alert Threshold</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingAlert(null)} className="rounded-full">
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Adjust the minimum stock threshold for <strong>{editingAlert.productName}</strong>. 
                This will update the alert threshold level.
              </p>
              <div className="space-y-2">
                <Label htmlFor="threshold-input">Stock Threshold Level</Label>
                <Input 
                  id="threshold-input" 
                  type="number" 
                  min="0" 
                  value={editThreshold} 
                  onChange={(e) => setEditThreshold(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingAlert(null)}>Cancel</Button>
              <Button onClick={async () => {
                if (['1', '2', '3', '4', '5'].includes(editingAlert.id)) {
                  setAlerts(prev => prev.map(a => a.id === editingAlert.id ? { ...a, minStockLevel: editThreshold, message: `Stock level is low. Threshold adjusted to ${editThreshold}.` } : a))
                  toast.success('Threshold updated successfully (demo)')
                  setEditingAlert(null)
                  return
                }
                try {
                  const res = await fetch(`/api/stock-alerts/${editingAlert.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ threshold: editThreshold }),
                  })
                  if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                      toast.success('Alert threshold updated successfully')
                      fetchAlerts()
                      setEditingAlert(null)
                    } else {
                      toast.error(data.error || 'Failed to update threshold')
                    }
                  } else {
                    toast.error('Failed to update threshold')
                  }
                } catch (err) {
                  console.error(err)
                  toast.error('Error updating threshold')
                }
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}