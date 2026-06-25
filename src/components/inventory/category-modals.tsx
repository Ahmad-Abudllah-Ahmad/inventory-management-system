'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Package, Tag, DollarSign, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
  productCount: number
  totalValue: number
  createdAt: string
  updatedAt: string
}

// ----------------------------------------------------------------------
// ADD CATEGORY MODAL
// ----------------------------------------------------------------------
interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddCategoryModal({ isOpen, onClose, onSuccess }: AddCategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Category name is required')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.details ? `${data.error}: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : data.error;
        throw new Error(errorMsg || 'Failed to create category');
      }
      
      toast.success('Category created successfully!')
      setFormData({ name: '', description: '', isActive: true })
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
          <h2 className="text-xl font-semibold">Add New Category</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Smart Watches" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="isActive" 
                name="isActive" 
                checked={formData.isActive} 
                onChange={handleChange} 
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active Category</Label>
            </div>
          </div>
          <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// EDIT CATEGORY MODAL
// ----------------------------------------------------------------------
interface EditCategoryModalProps {
  category: Category | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditCategoryModal({ category, isOpen, onClose, onSuccess }: EditCategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    if (category && isOpen) {
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive
      })
    }
  }, [category, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !category) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update category')
      
      toast.success('Category updated successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !category) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Category</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea 
                id="edit-description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="edit-isActive" 
                name="isActive" 
                checked={formData.isActive} 
                onChange={handleChange} 
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">Active Category</Label>
            </div>
          </div>
          <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// VIEW CATEGORY MODAL
// ----------------------------------------------------------------------
interface ViewCategoryModalProps {
  category: Category | null
  isOpen: boolean
  onClose: () => void
}

export function ViewCategoryModal({ category, isOpen, onClose }: ViewCategoryModalProps) {
  if (!isOpen || !category) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold">{category.name}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant={category.isActive ? 'default' : 'secondary'} className={category.isActive ? 'bg-green-100 text-green-800' : ''}>
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          {category.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{category.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg bg-muted/10">
              <p className="text-xs text-muted-foreground mb-1 flex items-center"><Package className="w-3 h-3 mr-1" /> Total Products</p>
              <p className="font-semibold">{category.productCount}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/10">
              <p className="text-xs text-muted-foreground mb-1 flex items-center"><DollarSign className="w-3 h-3 mr-1" /> Total Value</p>
              <p className="font-semibold">{formatCurrency(category.totalValue)}</p>
            </div>
          </div>
          
          <div className="space-y-2 text-xs text-muted-foreground border-t pt-4">
            <p className="flex items-center"><Calendar className="w-3 h-3 mr-2" /> Created: {new Date(category.createdAt).toLocaleString()}</p>
            <p className="flex items-center"><Calendar className="w-3 h-3 mr-2" /> Last Updated: {new Date(category.updatedAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="p-4 border-t bg-muted/20 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
