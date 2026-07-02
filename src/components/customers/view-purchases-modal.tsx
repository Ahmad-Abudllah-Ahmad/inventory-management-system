'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, Printer, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ViewPurchasesModalProps {
  isOpen: boolean
  onClose: () => void
  customer: any
}

export function ViewPurchasesModal({ isOpen, onClose, customer }: ViewPurchasesModalProps) {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchCustomerSales() {
      if (!customer) return
      try {
        setLoading(true)
        const res = await fetch(`/api/sales?customerId=${customer.id}&limit=100`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setSales(json.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch sales for customer', error)
        toast.error('Failed to fetch purchase history')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && customer) {
      fetchCustomerSales()
    }
  }, [isOpen, customer])

  if (!isOpen || !customer) return null

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePrint = (sale: any) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const itemsHtml = sale.items?.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.product?.name || 'Unknown Product'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">Rs ${Number(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">Rs ${Number(item.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('') || ''

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${sale.saleNumber}</title>
            <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; padding: 40px; max-width: 800px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f9fafb; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
              .total-section { margin-top: 20px; text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 style="margin: 0; color: #2563eb; font-family: 'Oswald', sans-serif; font-weight: 200;">fourty<span style="font-weight: 700;">1</span></h1>
                <p style="margin: 4px 0 0 0; color: #4b5563;">Grocery & Daily Needs Store</p>
              </div>
              <div style="text-align: right;">
                <h2 style="margin: 0;">INVOICE</h2>
                <p style="margin: 4px 0 0 0; font-family: monospace; font-weight: bold; color: #2563eb;">${sale.saleNumber}</p>
              </div>
            </div>
            <div class="meta-grid">
              <div>
                <strong>Billed To:</strong>
                <p style="margin: 4px 0;">${customer.firstName} ${customer.lastName || ''}</p>
                <p style="margin: 4px 0;">Phone: ${customer.phone}</p>
              </div>
              <div style="text-align: right;">
                <strong>Invoice Details:</strong>
                <p style="margin: 4px 0;">Date: ${new Date(sale.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 4px 0;">Payment Method: ${sale.paymentMethod}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Unit Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="total-section">
              <p style="margin: 4px 0;">Subtotal: <strong>Rs ${Number(sale.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
              <p style="margin: 4px 0;">Discount: <strong>Rs ${Number(sale.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
              <p style="margin: 4px 0;">Tax: <strong>Rs ${Number(sale.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
              <h2 style="margin: 10px 0 0 0; color: #2563eb;">Total: Rs ${Number(sale.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); }
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-3xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Customer Purchases & Invoices</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase history for {customer.firstName} {customer.lastName || ''} ({customer.phone})
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search filter bar */}
        <div className="p-4 border-b bg-muted/10 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by invoice number (e.g. SAL-X)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading purchases history...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {sales.length === 0 ? 'No purchases recorded for this customer.' : 'No invoices match your search.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/5 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-primary font-mono">{sale.saleNumber}</span>
                      <span className="text-xs text-muted-foreground">• {sale.items?.length || 0} items</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center space-x-3">
                      <span>Date: {formatDate(sale.createdAt)}</span>
                      <span>Payment: {sale.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(sale.totalAmount))}</p>
                      <p className="text-xs text-green-600 font-medium">Completed</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handlePrint(sale)}>
                        <Printer className="w-4 h-4 mr-1.5" />
                        Print Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-muted/20 flex justify-end flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
