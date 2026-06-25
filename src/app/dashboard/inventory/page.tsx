'use client'

import { useState, useEffect } from 'react'
import { useInventoryStore } from '@/store/inventory-store'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Scan
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AddProductModal } from '@/components/inventory/add-product-modal'
import { EditProductModal, ViewProductModal, DeleteProductModal } from '@/components/inventory/product-modals'

interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  categoryId: string
  category: { name: string }
  brandId?: string
  brand: { name: string } | null
  currentStock: number
  minStockLevel: number
  maxStockLevel: number
  costPrice: number
  salePrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const { 
    products, 
    isLoading, 
    searchTerm, 
    filterCategory, 
    filterBrand,
    sortBy,
    sortDirection,
    setSearchTerm,
    setFilterCategory,
    setFilterBrand,
    setSortBy,
    setSortDirection,
    getFilteredProducts,
    updateStock
  } = useInventoryStore()

  const [localProducts, setLocalProducts] = useState<Product[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setLocalProducts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const filteredProducts = localProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm))
    
    const matchesCategory = !filterCategory || product.category.name === filterCategory
    const matchesBrand = !filterBrand || (product.brand && product.brand.name === filterBrand)
    
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = product.currentStock <= product.minStockLevel && product.currentStock > 0
    } else if (stockFilter === 'out') {
      matchesStock = product.currentStock === 0
    }
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStock
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1
    switch (sortBy) {
      case 'name':
        return direction * a.name.localeCompare(b.name)
      case 'stock':
        return direction * (a.currentStock - b.currentStock)
      case 'price':
        return direction * (a.salePrice - b.salePrice)
      case 'created':
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      default:
        return 0
    }
  })

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return { status: 'Out of Stock', color: 'destructive' }
    if (product.currentStock <= product.minStockLevel) return { status: 'Low Stock', color: 'warning' }
    if (product.currentStock >= product.maxStockLevel) return { status: 'Overstock', color: 'secondary' }
    return { status: 'In Stock', color: 'success' }
  }

  const stats = {
    totalProducts: localProducts.length,
    totalValue: localProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0),
    lowStock: localProducts.filter(p => p.currentStock <= p.minStockLevel && p.currentStock > 0).length,
    outOfStock: localProducts.filter(p => p.currentStock === 0).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your product catalog, stock levels, and inventory operations
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
          <Button variant="outline" size="sm">
            <Scan className="w-4 h-4 mr-2" />
            Scan
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total cost value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              Unavailable items
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="price">Sort by Price</option>
              <option value="updated">Sort by Updated</option>
            </select>

            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <Button variant="outline" onClick={loadProducts}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Products ({sortedProducts.length})</CardTitle>
          <CardDescription>
            Manage your product inventory and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found. Add your first product to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Product</th>
                    <th className="text-left p-2 font-medium">SKU/Barcode</th>
                    <th className="text-left p-2 font-medium">Category</th>
                    <th className="text-left p-2 font-medium">Stock</th>
                    <th className="text-left p-2 font-medium">Price</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.brand?.name || 'No Brand'}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{product.sku}</div>
                            {product.barcode && (
                              <div className="text-muted-foreground">{product.barcode}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{product.category.name}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div className="font-medium">{product.currentStock}</div>
                            <div className="text-muted-foreground">
                              Min: {product.minStockLevel} | Max: {product.maxStockLevel}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div className="font-medium">{formatCurrency(product.salePrice || product.costPrice)}</div>
                            <div className="text-muted-foreground">Cost: {formatCurrency(product.costPrice)}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={stockStatus.color as any}>{stockStatus.status}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewingProduct(product)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeletingProduct(product)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
