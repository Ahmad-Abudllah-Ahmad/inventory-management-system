'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { ReturnModal } from '@/components/sales/return-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Printer, 
  Plus,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Undo2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Sale {
  id: string
  saleNumber: string
  customerName: string
  totalAmount: number
  paymentMethod: string
  status: string
  createdAt: string
  itemsCount: number
}

export default function SalesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)

  const mapSaleToOrder = (sale: any) => {
    if (!sale) return null
    return {
      id: sale.saleNumber,
      customerName: sale.customer 
        ? `${sale.customer.firstName} ${sale.customer.lastName || ''}`.trim()
        : 'Walk-in Customer',
      customerPhone: sale.customer?.phone || '',
      itemsCount: sale.items?.length || 0,
      subtotal: Number(sale.subtotal),
      taxAmount: Number(sale.taxAmount || 0),
      discountAmount: Number(sale.discountAmount || 0),
      total: Number(sale.totalAmount),
      paymentMethod: sale.paymentMethod,
      time: sale.createdAt,
      status: sale.status,
      isRefunded: sale.status === 'RETURNED' || (sale.returns && sale.returns.length > 0),
      items: sale.items?.map((item: any) => ({
        id: item.id,
        productName: item.product?.name || 'Unknown Product',
        productSku: item.product?.sku || 'N/A',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discount: Number(item.discount || 0),
      })) || []
    }
  }

  const handleDirectPrint = (sale: any) => {
    const order = mapSaleToOrder(sale)
    if (!order) return

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

  const fetchSales = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/sales?limit=100')
      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setSales(data.data.map((sale: any) => ({
            ...sale,
            customerName: sale.customer?.firstName || 'Walk-in',
            itemsCount: sale.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
          })))
        }
      }
    } catch (error) {
      console.error('Failed to fetch sales', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const searchParam = params.get('search')
      if (searchParam) {
        setSearchTerm(searchParam)
      }
    }
  }, [])

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
    completedSales: sales.filter(sale => sale.status === 'COMPLETED').length,
    pendingSales: sales.filter(sale => sale.status === 'PENDING').length
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'RETURNED':
        return <Badge className="bg-orange-100 text-orange-800">Returned</Badge>
      case 'PARTIAL_RETURN':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial Return</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="w-4 h-4" />
      case 'CARD':
        return <ShoppingCart className="w-4 h-4" />
      case 'MOBILE_PAYMENT':
        return <Users className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
          <p className="text-muted-foreground">
            View and manage all sales transactions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/dashboard/pos')}>
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">All time sales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total earnings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSales}</div>
            <p className="text-xs text-muted-foreground">Successful sales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSales}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
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
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Latest sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading sales...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(sale.paymentMethod)}
                      <div>
                        <p className="font-medium">{sale.saleNumber}</p>
                        <p className="text-sm text-muted-foreground">{sale.customerName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(sale.totalAmount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.itemsCount} items • {formatDate(sale.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(sale.status)}
                      
                      {sale.status === 'COMPLETED' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={() => {
                            setSelectedSale(sale)
                            setShowReturnModal(true)
                          }}
                          title="Process Return/Refund"
                        >
                          <Undo2 className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="View Details"
                        onClick={() => {
                          setSelectedSale(sale)
                          setShowInvoiceModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        title="Print Invoice"
                        onClick={() => {
                          handleDirectPrint(sale)
                        }}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReturnModal 
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSuccess={fetchSales}
        sale={selectedSale}
      />

      <InvoicePreviewModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={mapSaleToOrder(selectedSale)}
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