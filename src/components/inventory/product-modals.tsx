'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Package, Hash, DollarSign, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  categoryId: string
  category: { name: string }
  brand?: { name: string }
  currentStock: number
  minStockLevel: number
  maxStockLevel: number
  costPrice: number
  salePrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
}

// ----------------------------------------------------------------------
// EDIT PRODUCT MODAL
// ----------------------------------------------------------------------
interface EditProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditProductModal({ product, isOpen, onClose, onSuccess }: EditProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCategories, setIsFetchingCategories] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    costPrice: '',
    sellingPrice: '',
    minStockLevel: '5'
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name,
        sku: product.barcode || product.sku,
        categoryId: product.categoryId,
        costPrice: product.costPrice.toString(),
        sellingPrice: product.salePrice?.toString() || product.costPrice.toString(),
        minStockLevel: product.minStockLevel.toString()
      })
    }
  }, [product, isOpen])

  const fetchCategories = async () => {
    setIsFetchingCategories(true)
    try {
      const res = await fetch('/api/categories?limit=100')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setCategories(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setIsFetchingCategories(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    if (!formData.name || !formData.categoryId || !formData.costPrice || !formData.sellingPrice) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        minStockLevel: parseInt(formData.minStockLevel || '5', 10),
        ...(formData.sku ? { barcode: formData.sku } : {})
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.details ? `${data.error}: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : data.error;
        throw new Error(errorMsg || 'Failed to update product');
      }

      toast.success('Product updated successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(error.message || 'An error occurred while saving.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Product</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Barcode</Label>
                <Input 
                  id="sku" 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleChange} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <select 
                  id="categoryId" 
                  name="categoryId" 
                  value={formData.categoryId} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground h-10"
                  required
                >
                  <option value="" disabled>
                    {isFetchingCategories ? 'Loading...' : 'Select Category'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($) *</Label>
                <Input 
                  id="costPrice" 
                  name="costPrice" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={formData.costPrice} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price ($) *</Label>
                <Input 
                  id="sellingPrice" 
                  name="sellingPrice" 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={formData.sellingPrice} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Min Stock Alert Level</Label>
                <Input 
                  id="minStockLevel" 
                  name="minStockLevel" 
                  type="number" 
                  min="0" 
                  value={formData.minStockLevel} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-product-form" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// DELETE PRODUCT MODAL
// ----------------------------------------------------------------------
interface DeleteProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteProductModal({ product, isOpen, onClose, onSuccess }: DeleteProductModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!product) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to delete product')
      }
      
      toast.success('Product deleted successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Delete Product?</h2>
          <p className="text-muted-foreground mb-6">
            Are you sure you want to delete <span className="font-semibold text-foreground">{product.name}</span>? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// VIEW PRODUCT MODAL
// ----------------------------------------------------------------------
interface ViewProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function ViewProductModal({ product, isOpen, onClose }: ViewProductModalProps) {
  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Product Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{product.name}</h3>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Tag className="w-4 h-4" />
                {product.category?.name} {product.brand ? `• ${product.brand.name}` : ''}
              </p>
            </div>
            <Badge variant={product.isActive ? 'success' : 'secondary'} className={product.isActive ? 'bg-green-100 text-green-800' : ''}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="w-4 h-4" />
                <span className="text-sm">Current Stock</span>
              </div>
              <div className="text-xl font-semibold">{product.currentStock} units</div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Selling Price</span>
              </div>
              <div className="text-xl font-semibold">{formatCurrency(product.salePrice || product.costPrice)}</div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-sm">SKU</span>
              </div>
              <div className="text-lg font-medium font-mono">{product.sku}</div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-sm">Barcode</span>
              </div>
              <div className="text-lg font-medium font-mono">{product.barcode || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t bg-muted/20 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
