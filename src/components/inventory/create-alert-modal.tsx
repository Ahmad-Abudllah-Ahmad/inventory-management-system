'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  sku: string
}

interface CreateAlertModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAlertModal({ isOpen, onClose, onSuccess }: CreateAlertModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  
  const [formData, setFormData] = useState({
    productId: '',
    type: 'LOW_STOCK',
    threshold: 10,
    message: ''
  })

  useEffect(() => {
    if (isOpen) {
      // Fetch products when modal opens
      fetch('/api/products?limit=1000')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setProducts(data.data)
          }
        })
        .catch(err => console.error('Failed to load products:', err))
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'threshold' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productId || !formData.message) {
      toast.error('Product and Message are required')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create alert')
      
      toast.success('Stock alert created successfully!')
      setFormData({ productId: '', type: 'LOW_STOCK', threshold: 10, message: '' })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create Stock Alert</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product *</Label>
              <select 
                id="productId" 
                name="productId" 
                value={formData.productId} 
                onChange={handleChange} 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Alert Type *</Label>
                <select 
                  id="type" 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange} 
                  required 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="OVERSTOCK">Overstock</option>
                  <option value="EXPIRY_WARNING">Expiry Warning</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold Limit *</Label>
                <Input 
                  id="threshold" 
                  name="threshold" 
                  type="number" 
                  min="0"
                  value={formData.threshold} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Alert Message *</Label>
              <textarea 
                id="message" 
                name="message" 
                value={formData.message} 
                onChange={handleChange} 
                required
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="E.g., Notify manager when stock drops below threshold"
              />
            </div>
          </div>
          <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Alert'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
