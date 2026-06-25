'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface Category {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newProduct?: any) => void
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)

  // Brand creation state
  const [showAddBrandModal, setShowAddBrandModal] = useState(false)
  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandWebsite, setNewBrandWebsite] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    sku: '', // Optional in UI, auto-generated if empty
    categoryId: '',
    brandId: '', // Optional brand
    costPrice: '',
    sellingPrice: '',
    currentStock: '0',
    minStockLevel: '5'
  })

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    setIsFetchingData(true)
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/categories?limit=100'),
        fetch('/api/brands?limit=100').catch(() => null) // Fallback if API doesn't exist
      ])
      
      if (catRes.ok) {
        const catData = await catRes.json()
        if (catData.success && catData.data) setCategories(catData.data)
      }
      
      if (brandRes && brandRes.ok) {
        const brandData = await brandRes.json()
        if (brandData.success && brandData.data) setBrands(brandData.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load categories/brands')
    } finally {
      setIsFetchingData(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBrandName.trim()) {
      toast.error('Brand name is required')
      return
    }

    setIsAddingBrand(true)
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBrandName.trim(),
          website: newBrandWebsite.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create brand')
      }

      toast.success('Brand added successfully!')
      
      const brandVal = data.data || data.brand;
      setBrands((prev) => [...prev, brandVal])
      setFormData((prev) => ({ ...prev, brandId: brandVal.id }))
      
      setNewBrandName('')
      setNewBrandWebsite('')
      setShowAddBrandModal(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error creating brand')
    } finally {
      setIsAddingBrand(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.categoryId || !formData.brandId || !formData.costPrice || !formData.sellingPrice) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        ...(formData.brandId ? { brandId: formData.brandId } : {}),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        currentStock: parseInt(formData.currentStock || '0', 10),
        minStockLevel: parseInt(formData.minStockLevel || '5', 10),
        ...(formData.sku ? { barcode: formData.sku } : {}) // Pass SKU as barcode to backend if provided
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.details ? `${data.error}: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : data.error;
        throw new Error(errorMsg || 'Failed to create product');
      }

      toast.success('Product created successfully!')
      
      // Reset form
      setFormData({
        name: '',
        sku: '',
        categoryId: '',
        brandId: '',
        costPrice: '',
        sellingPrice: '',
        currentStock: '0',
        minStockLevel: '5'
      })
      
      onSuccess(data.product)
      onClose()
    } catch (error: any) {
      console.error('Submission error:', error)
      toast.error(error.message || 'An error occurred while saving.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Product</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="add-product-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. iPhone 15 Pro Max" 
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
                  placeholder="Leave empty to auto-generate" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <SearchableSelect
                  options={categories.map(cat => ({ id: cat.id, name: cat.name }))}
                  value={formData.categoryId}
                  onChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                  placeholder={isFetchingData ? 'Loading...' : 'Select Category'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="brandId">Brand *</Label>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-xs flex items-center"
                    onClick={() => setShowAddBrandModal(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Brand
                  </Button>
                </div>
                <SearchableSelect
                  options={brands.map(b => ({ id: b.id, name: b.name }))}
                  value={formData.brandId}
                  onChange={(val) => setFormData(prev => ({ ...prev, brandId: val }))}
                  placeholder={isFetchingData ? 'Loading...' : 'Select Brand'}
                />
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
                  placeholder="0.00" 
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
                  placeholder="0.00" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Min Stock Level Alert</Label>
              <Input 
                id="minStockLevel" 
                name="minStockLevel" 
                type="number" 
                min="0" 
                value={formData.minStockLevel} 
                onChange={handleChange} 
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-product-form" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Product'
            )}
          </Button>
        </div>
      </div>

      {/* Add New Brand Modal */}
      {showAddBrandModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 text-foreground border">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Add New Brand</h3>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAddBrandModal(false)} 
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleAddBrand}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Brand Name *</Label>
                  <Input 
                    id="brand-name"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g. Google"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand-website">Website (Optional)</Label>
                  <Input 
                    id="brand-website"
                    value={newBrandWebsite}
                    onChange={(e) => setNewBrandWebsite(e.target.value)}
                    placeholder="e.g. https://google.com"
                  />
                </div>
              </div>
              <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddBrandModal(false)}
                  disabled={isAddingBrand}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingBrand}>
                  {isAddingBrand ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Brand'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
