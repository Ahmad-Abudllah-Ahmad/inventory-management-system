'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Undo2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SaleItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: { name: string; sku: string }
}

interface ReturnModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sale: any | null
}

export function ReturnModal({ isOpen, onClose, onSuccess, sale }: ReturnModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')

  // Initialize return quantities
  useEffect(() => {
    if (isOpen && sale) {
      const initial: Record<string, number> = {}
      sale.items.forEach((item: SaleItem) => {
        initial[item.productId] = 0 // default to 0 returned
      })
      setReturnQuantities(initial)
      setReason('')
    }
  }, [isOpen, sale])

  if (!isOpen || !sale) return null

  const handleQuantityChange = (productId: string, val: number, maxQty: number) => {
    let q = val
    if (isNaN(q) || q < 0) q = 0
    if (q > maxQty) q = maxQty
    setReturnQuantities(prev => ({ ...prev, [productId]: q }))
  }

  const handleReturnAll = () => {
    const all: Record<string, number> = {}
    sale.items.forEach((item: SaleItem) => {
      all[item.productId] = item.quantity
    })
    setReturnQuantities(all)
  }

  // Calculate total refund
  const totalRefund = sale.items.reduce((sum: number, item: SaleItem) => {
    const qty = returnQuantities[item.productId] || 0
    return sum + (qty * item.unitPrice)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const itemsToReturn = sale.items
      .filter((item: SaleItem) => (returnQuantities[item.productId] || 0) > 0)
      .map((item: SaleItem) => ({
        productId: item.productId,
        quantity: returnQuantities[item.productId] || 0,
        unitPrice: item.unitPrice,
        totalPrice: (returnQuantities[item.productId] || 0) * item.unitPrice,
        reason: reason
      }))

    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/sales/${sale.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToReturn, reason })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to process return')
      
      toast.success('Return processed successfully! Stock has been adjusted.')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <div className="flex items-center space-x-2">
            <Undo2 className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold">Process Return / Refund</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
            <div>
              <p className="text-sm text-muted-foreground">Sale Number</p>
              <p className="font-semibold">{sale.saleNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{sale.customer?.firstName || sale.customerName || 'Walk-in'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Original Total</p>
              <p className="font-bold text-lg">{formatCurrency(sale.totalAmount)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">Items in Sale</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleReturnAll}>
                Select All
              </Button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left font-medium">Product</th>
                    <th className="p-3 text-center font-medium">Qty Sold</th>
                    <th className="p-3 text-center font-medium">Unit Price</th>
                    <th className="p-3 text-center font-medium">Return Qty</th>
                    <th className="p-3 text-right font-medium">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sale.items.map((item: SaleItem) => {
                    const currentRetQty = returnQuantities[item.productId] || 0
                    const lineRefund = currentRetQty * item.unitPrice
                    
                    return (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                        </td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-center">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3">
                          <div className="flex justify-center items-center">
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={currentRetQty}
                              onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value), item.quantity)}
                              className="w-20 text-center"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium text-orange-600">
                          {formatCurrency(lineRefund)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason for Return (Optional)</Label>
            <Input 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="e.g. Defective, Changed mind, etc." 
            />
          </div>

          <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Return Summary</p>
              <p className="text-sm text-orange-700 mt-1">
                Total Refund Amount: <strong className="text-lg ml-2">{formatCurrency(totalRefund)}</strong>
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Inventory will automatically be restocked with the returned quantities.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || totalRefund === 0}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : `Process Refund`}
          </Button>
        </div>
      </div>
    </div>
  )
}
