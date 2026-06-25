'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { AddProductModal } from '@/components/inventory/add-product-modal'
import { EditProductModal, ViewProductModal, DeleteProductModal } from '@/components/inventory/product-modals'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  Filter,
  Download,
  Upload,
  Barcode,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  categoryId: string
  category: { name: string }
  brandId?: string
  brand?: { name: string } | null
  costPrice: number
  sellingPrice: number
  salePrice?: number
  currentStock: number
  minStockLevel: number
  maxStockLevel?: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const searchParam = params.get('search')
      if (searchParam) {
        setSearchTerm(searchParam)
      }
    }
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm))
    const matchesCategory = categoryFilter === 'all' || product.category.name === categoryFilter
    const matchesBrand = brandFilter === 'all' || (product.brand && product.brand.name === brandFilter)
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive)
    
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = product.currentStock <= product.minStockLevel && product.currentStock > 0
    } else if (stockFilter === 'out') {
      matchesStock = product.currentStock === 0
    } else if (stockFilter === 'overstock') {
      matchesStock = product.maxStockLevel ? product.currentStock >= product.maxStockLevel : false
    }
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesStock
  })

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isActive).length,
    lowStockProducts: products.filter(p => p.currentStock <= p.minStockLevel && p.currentStock > 0).length,
    outOfStockProducts: products.filter(p => p.currentStock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
  }

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) {
      return { status: 'Out of Stock', color: 'destructive', icon: XCircle }
    }
    if (product.currentStock <= product.minStockLevel) {
      return { status: 'Low Stock', color: 'warning', icon: AlertTriangle }
    }
    if (product.maxStockLevel && product.currentStock >= product.maxStockLevel) {
      return { status: 'Overstock', color: 'secondary', icon: AlertTriangle }
    }
    return { status: 'In Stock', color: 'success', icon: CheckCircle }
  }

  const categories = Array.from(new Set(products.map(p => p.category.name)))
  const brands = Array.from(new Set(products.map(p => p.brand?.name).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => {
            // TODO: Implement import functionality
            alert('Import functionality will be implemented')
          }}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => {
            // TODO: Implement export functionality
            alert('Export functionality will be implemented')
          }}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">All products</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">Zero stock</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total value</p>
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            All products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                const StatusIcon = stockStatus.icon
                
                return (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{product.name}</p>
                          {product.isFeatured && (
                            <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                          )}
                          {product.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>{product.sku}</span>
                          </div>
                          {product.barcode && (
                            <div className="flex items-center space-x-1">
                              <Barcode className="w-3 h-3" />
                              <span>{product.barcode}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <span>{product.category.name}</span>
                          </div>
                          {product.brand && (
                            <div className="flex items-center space-x-1">
                              <span>{product.brand.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-4 h-4 text-${stockStatus.color === 'destructive' ? 'red' : stockStatus.color === 'warning' ? 'orange' : stockStatus.color === 'success' ? 'green' : 'gray'}-500`} />
                          <span className={`text-sm font-medium text-${stockStatus.color === 'destructive' ? 'red' : stockStatus.color === 'warning' ? 'orange' : stockStatus.color === 'success' ? 'green' : 'gray'}-600`}>
                            {stockStatus.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.currentStock} in stock
                        </p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setViewingProduct(product)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setDeletingProduct(product)}>
                          <Trash2 className="w-4 h-4" />
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

      <AddProductModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={loadProducts} 
      />

      <ViewProductModal 
        isOpen={!!viewingProduct} 
        product={viewingProduct as any} 
        onClose={() => setViewingProduct(null)} 
      />
      
      <EditProductModal 
        isOpen={!!editingProduct} 
        product={editingProduct as any} 
        onClose={() => setEditingProduct(null)} 
        onSuccess={loadProducts} 
      />
      
      <DeleteProductModal 
        isOpen={!!deletingProduct} 
        product={deletingProduct as any} 
        onClose={() => setDeletingProduct(null)} 
        onSuccess={loadProducts} 
      />
    </div>
  )
}