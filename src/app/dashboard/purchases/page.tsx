'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { CreatePurchaseModal } from '@/components/purchases/create-purchase-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  TruckIcon, 
  DollarSign, 
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Purchase {
  id: string
  purchaseNumber: string
  supplier: {
    id: string
    name: string
    contactPerson: string
    phone: string
  }
  items: Array<{
    id: string
    product: {
      name: string
      sku: string
      brand?: {
        name: string
      } | null
    }
    quantity: number
    unitCost: number
    totalCost: number
  }>
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  notes?: string | null
  createdBy: {
    name: string
  }
  createdAt: string
  updatedAt: string
}

export default function PurchasesPage() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [initialProductId, setInitialProductId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('new') === 'true') {
        const prodId = params.get('productId')
        if (prodId) {
          setInitialProductId(prodId)
        }
        setShowAddModal(true)
        
        // Clean URL query parameters to avoid re-triggering modal on page refresh
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [])

  // View Modal state
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editStatus, setEditStatus] = useState<'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'>('PENDING')
  const [editExpectedDate, setEditExpectedDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/purchases')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases || [])
      }
    } catch (error) {
      console.error('Failed to load purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }

  const handleEditClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setEditStatus(purchase.status)
    setEditExpectedDate((purchase.expectedDate ? new Date(purchase.expectedDate).toISOString().split('T')[0] : '') || '')
    setEditNotes(purchase.notes || '')
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPurchase) return
    
    setIsSavingEdit(true)
    try {
      const res = await fetch(`/api/purchases/${selectedPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          expectedDate: editExpectedDate || null,
          notes: editNotes || null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update purchase order')
      
      toast.success('Purchase order updated successfully!')
      setShowEditModal(false)
      loadPurchases()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async (purchase: Purchase) => {
    if (!confirm(`Are you sure you want to delete purchase order ${purchase.purchaseNumber}? This will revert any stock changes.`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/purchases/${purchase.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete purchase order')
      
      toast.success('Purchase order deleted successfully!')
      loadPurchases()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    }
  }

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Purchase['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'ORDERED':
        return <Badge variant="default"><Package className="w-3 h-3 mr-1" />Ordered</Badge>
      case 'RECEIVED':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Received</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const stats = {
    totalPurchases: purchases.length,
    totalValue: purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0),
    pendingOrders: purchases.filter(p => p.status === 'PENDING' || p.status === 'ORDERED').length,
    monthlySpend: purchases
      .filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth())
      .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Management</h1>
          <p className="text-muted-foreground">
            Manage purchase orders, suppliers, and inventory procurement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total purchase value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlySpend)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <Button variant="outline" onClick={loadPurchases}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purchase Orders ({filteredPurchases.length})</CardTitle>
          <CardDescription>
            Track and manage your purchase orders and supplier relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading purchase orders...</div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found. Create your first purchase order to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Order #</th>
                    <th className="text-left p-2 font-medium">Supplier</th>
                    <th className="text-left p-2 font-medium">Items</th>
                    <th className="text-left p-2 font-medium">Total Amount</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Order Date</th>
                    <th className="text-left p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium">{purchase.purchaseNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          By {purchase.createdBy.name}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{purchase.supplier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {purchase.supplier.contactPerson}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div className="font-medium">{purchase.items.length} items</div>
                          <div className="text-muted-foreground">
                            {purchase.items.slice(0, 2).map(item => {
                              const brandPrefix = item.product.brand?.name ? `${item.product.brand.name} - ` : ''
                              return `${brandPrefix}${item.product.name}`
                            }).join(', ')}
                            {purchase.items.length > 2 && '...'}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{formatCurrency(purchase.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">
                          Subtotal: {formatCurrency(purchase.subtotal)}
                        </div>
                      </td>
                      <td className="p-2">
                        <div 
                          onClick={() => handleEditClick(purchase)}
                          className="cursor-pointer hover:opacity-80 transition-opacity inline-flex"
                          title="Click to change status"
                        >
                          {getStatusBadge(purchase.status)}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div>{formatDate(purchase.orderDate)}</div>
                          {purchase.expectedDate && (
                            <div className="text-muted-foreground">
                              Expected: {formatDate(purchase.expectedDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="View Details" onClick={() => handleView(purchase)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit Order" onClick={() => handleEditClick(purchase)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Delete Order" onClick={() => handleDelete(purchase)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePurchaseModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false)
          setInitialProductId(undefined)
        }} 
        onSuccess={loadPurchases} 
        initialProductId={initialProductId}
      />

      {/* View Details Modal */}
      {showViewModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col my-8 animate-in zoom-in-95 overflow-hidden text-foreground">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Purchase Order Details
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Order Number: <span className="font-mono font-medium text-foreground">{selectedPurchase.purchaseNumber}</span>
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)} className="rounded-full">
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Order Status & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/20 border border-dashed">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block font-semibold">Status</span>
                  {getStatusBadge(selectedPurchase.status)}
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block font-semibold">Order Date</span>
                  <span className="text-sm font-medium">{formatDate(selectedPurchase.orderDate)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block font-semibold">Expected Date</span>
                  <span className="text-sm font-medium">{selectedPurchase.expectedDate ? formatDate(selectedPurchase.expectedDate) : 'Not specified'}</span>
                </div>
              </div>

              {/* Supplier Info */}
              <div>
                <h3 className="text-md font-semibold border-b pb-2 mb-3">Supplier Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold">Supplier Name</span>
                    <p className="text-sm font-medium">{selectedPurchase.supplier.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold">Contact Person</span>
                    <p className="text-sm font-medium">{selectedPurchase.supplier.contactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold">Phone</span>
                    <p className="text-sm font-medium">{selectedPurchase.supplier.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold">Created By</span>
                    <p className="text-sm font-medium">{selectedPurchase.createdBy?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-md font-semibold border-b pb-2 mb-3">Ordered Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b">
                        <th className="text-left p-3 font-medium">Product / SKU</th>
                        <th className="text-right p-3 font-medium">Qty</th>
                        <th className="text-right p-3 font-medium">Unit Cost</th>
                        <th className="text-right p-3 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/10">
                          <td className="p-3">
                            <div className="font-medium">
                              {item.product.brand?.name ? `${item.product.brand.name} - ` : ''}
                              {item.product.name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{item.product.sku}</div>
                          </td>
                          <td className="text-right p-3">{item.quantity}</td>
                          <td className="text-right p-3">{formatCurrency(item.unitCost)}</td>
                          <td className="text-right p-3 font-medium">{formatCurrency(item.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground font-semibold">Order Notes</span>
                  <p className="text-sm p-3 bg-muted/10 border rounded-lg italic text-muted-foreground min-h-[80px]">
                    {selectedPurchase.notes || 'No notes added to this order.'}
                  </p>
                </div>
                
                <div className="bg-muted/10 p-4 rounded-lg border space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedPurchase.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Tax Amount</span>
                    <span>{formatCurrency(selectedPurchase.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-base border-t pt-2.5 mt-2.5">
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedPurchase.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-muted/10 flex justify-end shrink-0">
              <Button onClick={() => setShowViewModal(false)}>Close Details</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 text-foreground">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Purchase Order
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)} className="rounded-full">
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">Order Number</span>
                  <p className="text-sm font-mono font-medium mt-0.5">{selectedPurchase.purchaseNumber}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editStatus">Order Status</Label>
                  <select 
                    id="editStatus"
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                    required
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ORDERED">Ordered</option>
                    <option value="RECEIVED">Received</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Changing the status to <strong>Received</strong> will automatically increment products inventory. Transitioning away from <strong>Received</strong> will decrement it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editExpectedDate">Expected Delivery Date</Label>
                  <Input 
                    id="editExpectedDate"
                    type="date"
                    value={editExpectedDate}
                    onChange={(e) => setEditExpectedDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editNotes">Order Notes</Label>
                  <textarea 
                    id="editNotes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full h-24 px-3 py-2 border rounded-md bg-background resize-none"
                    placeholder="Update order notes..."
                  />
                </div>
              </div>
              
              <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} disabled={isSavingEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
