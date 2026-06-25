'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { AddProductModal } from '@/components/inventory/add-product-modal'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface Product {
  id: string
  name: string
  sku: string
  costPrice: number
  brand?: {
    name: string
  } | null
}

interface Supplier {
  id: string
  name: string
}

interface CreatePurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialProductId?: string | undefined
}

interface PurchaseItem {
  productId: string
  quantity: number
  unitCost: number
}

export function CreatePurchaseModal({ isOpen, onClose, onSuccess, initialProductId }: CreatePurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  const [supplierId, setSupplierId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [taxAmount, setTaxAmount] = useState(0)
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [status, setStatus] = useState<'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'>('PENDING')
  
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierContact, setNewSupplierContact] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [newSupplierAddress, setNewSupplierAddress] = useState('')

  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
      fetchProducts()
      // Reset form
      setSupplierId('')
      setExpectedDate('')
      setNotes('')
      setTaxAmount(0)
      setStatus('PENDING')
      setShowAddSupplierModal(false)
      setIsAddingSupplier(false)
      setNewSupplierName('')
      setNewSupplierContact('')
      setNewSupplierPhone('')
      setNewSupplierAddress('')
      setShowAddProductModal(false)
      setCurrentItemIndex(null)

      if (initialProductId) {
        setItems([{ productId: initialProductId, quantity: 1, unitCost: 0 }])
      } else {
        setItems([])
      }
    }
  }, [isOpen, initialProductId])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch suppliers', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=1000')
      if (res.ok) {
        const data = await res.json()
        const prodList = data.data || []
        setProducts(prodList)

        // Auto-fill unitCost for initialProductId if it is set in items
        if (initialProductId) {
          const product = prodList.find((p: any) => p.id === initialProductId)
          if (product) {
            setItems(prev => prev.map(item => 
              item.productId === initialProductId 
                ? { ...item, unitCost: Number(product.costPrice) || 0 }
                : item
            ))
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch products', error)
    }
  }

  const handleProductSuccess = async (newProduct?: Product) => {
    const res = await fetch('/api/products?limit=1000')
    if (res.ok) {
      const data = await res.json()
      const prodList = data.data || []
      setProducts(prodList)
    }
    
    if (currentItemIndex !== null && newProduct) {
      const newItems = [...items]
      if (newItems[currentItemIndex]) {
        newItems[currentItemIndex].productId = newProduct.id
        newItems[currentItemIndex].unitCost = Number(newProduct.costPrice) || 0
        setItems(newItems)
      }
    }
    
    setShowAddProductModal(false)
    setCurrentItemIndex(null)
  }

  if (!isOpen) return null

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitCost: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items]
    if (!newItems[index]) return;
    
    if (field === 'productId') {
      newItems[index]!.productId = value as string
      // Auto-fill cost price
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index]!.unitCost = Number(product.costPrice) || 0
      }
    } else {
      newItems[index] = { ...newItems[index]!, [field]: value } as PurchaseItem
    }
    
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitCost)), 0)
  const totalAmount = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supplierId) {
      toast.error('Please select a supplier')
      return
    }
    
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }
    
    if (items.some(i => !i.productId || Number(i.quantity) <= 0 || Number(i.unitCost) < 0)) {
      toast.error('Please fill all item details correctly')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        supplierId,
        expectedDate: expectedDate || undefined,
        notes,
        subtotal,
        taxAmount,
        totalAmount,
        status,
        items: items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
          totalCost: Number(i.quantity) * Number(i.unitCost)
        }))
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to create purchase order')
      
      toast.success('Purchase order created successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col my-8 animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">New Purchase Order</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-xs flex items-center"
                    onClick={() => setShowAddSupplierModal(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Supplier
                  </Button>
                </div>
                <SearchableSelect
                  options={suppliers.map(s => ({ id: s.id, name: s.name }))}
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder="Select a supplier..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="ORDERED">Ordered</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                <Input 
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Order Items *</h3>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 border rounded-lg border-dashed">
                  <p className="text-muted-foreground">No items added to this order.</p>
                  <Button type="button" variant="link" onClick={handleAddItem}>Add your first item</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-4 border rounded-lg bg-muted/10">
                      <div className="w-full md:flex-1 space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Product</Label>
                          <Button 
                            type="button" 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-xs flex items-center"
                            onClick={() => {
                              setCurrentItemIndex(index)
                              setShowAddProductModal(true)
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Product
                          </Button>
                        </div>
                        <SearchableSelect
                          options={products.map(p => ({
                            id: p.id,
                            name: `${p.brand?.name ? `${p.brand.name} - ` : ''}${p.name} (${p.sku})`
                          }))}
                          value={item.productId}
                          onChange={(val) => handleItemChange(index, 'productId', val)}
                          placeholder="Select a product..."
                        />
                      </div>
                      
                      <div className="w-full md:w-32 space-y-2">
                        <Label>Quantity</Label>
                        <Input 
                          type="number" 
                          min="1"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          required
                        />
                      </div>

                      <div className="w-full md:w-32 space-y-2">
                        <Label>Unit Cost</Label>
                        <Input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={item.unitCost === 0 && !item.productId ? '' : item.unitCost}
                          onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      
                      <div className="w-full md:w-32 space-y-2">
                        <Label>Total</Label>
                        <div className="px-3 py-2 border rounded-md bg-muted/30 font-medium">
                          ${(item.quantity * item.unitCost).toFixed(2)}
                        </div>
                      </div>

                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveItem(index)}
                        className="text-destructive mb-0.5"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <textarea 
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-32 px-3 py-2 border rounded-md bg-background resize-none"
                  placeholder="Any special instructions or notes..."
                />
              </div>

              <div className="bg-muted/20 p-6 rounded-lg border space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Order Summary</h3>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tax Amount</span>
                  <div className="w-24">
                    <Input 
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-8 text-right"
                      value={taxAmount || ''}
                      onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center font-semibold text-lg border-t pt-3 mt-3">
                  <span>Total Amount</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 border-t bg-muted/10 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading || items.length === 0}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </div>

      {/* Add New Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Add New Supplier</h3>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAddSupplierModal(false)} 
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!newSupplierName.trim()) {
                toast.error('Supplier name is required')
                return
              }
              setIsAddingSupplier(true)
              try {
                const res = await fetch('/api/suppliers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: newSupplierName,
                    contactPerson: newSupplierContact || undefined,
                    phone: newSupplierPhone || undefined,
                    address: newSupplierAddress || undefined
                  })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Failed to add supplier')
                
                toast.success('Supplier added successfully!')
                // Refetch suppliers and select the new one
                const newSupplierId = data.data.id
                await fetchSuppliers()
                setSupplierId(newSupplierId)
                
                // Clear fields & close
                setNewSupplierName('')
                setNewSupplierContact('')
                setNewSupplierPhone('')
                setNewSupplierAddress('')
                setShowAddSupplierModal(false)
              } catch (err: any) {
                toast.error(err.message || 'Error creating supplier')
              } finally {
                setIsAddingSupplier(false)
              }
            }}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier-name">Supplier Name *</Label>
                  <Input 
                    id="supplier-name"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="e.g. Al-Fatah Distributors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-contact">Contact Person</Label>
                  <Input 
                    id="supplier-contact"
                    value={newSupplierContact}
                    onChange={(e) => setNewSupplierContact(e.target.value)}
                    placeholder="e.g. Muhammad Ahmad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-phone">Phone Number</Label>
                  <Input 
                    id="supplier-phone"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="e.g. +92-300-1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-address">Address</Label>
                  <Input 
                    id="supplier-address"
                    value={newSupplierAddress}
                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                    placeholder="e.g. Liberty Market, Lahore"
                  />
                </div>
              </div>
              <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddSupplierModal(false)}
                  disabled={isAddingSupplier}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingSupplier}>
                  {isAddingSupplier ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      <AddProductModal 
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false)
          setCurrentItemIndex(null)
        }}
        onSuccess={handleProductSuccess}
      />
    </div>
  )
}
