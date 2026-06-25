import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, Category, Brand, StockAlert } from '@prisma/client'

export interface ProductWithRelations extends Product {
  category: Category
  brand?: Brand
  stockAlerts?: StockAlert[]
}

interface InventoryState {
  // Products
  products: ProductWithRelations[]
  selectedProduct: ProductWithRelations | null
  
  // Categories & Brands
  categories: Category[]
  brands: Brand[]
  
  // Stock Alerts
  stockAlerts: StockAlert[]
  
  // UI State
  isLoading: boolean
  searchTerm: string
  filterCategory: string
  filterBrand: string
  sortBy: 'name' | 'price' | 'stock' | 'created'
  sortDirection: 'asc' | 'desc'
  
  // Actions
  initialize: () => void
  setProducts: (products: ProductWithRelations[]) => void
  addProduct: (product: ProductWithRelations) => void
  updateProduct: (id: string, product: Partial<ProductWithRelations>) => void
  deleteProduct: (id: string) => void
  setSelectedProduct: (product: ProductWithRelations | null) => void
  
  // Categories & Brands
  setCategories: (categories: Category[]) => void
  setBrands: (brands: Brand[]) => void
  addCategory: (category: Category) => void
  addBrand: (brand: Brand) => void
  
  // Stock Management
  updateStock: (productId: string, newStock: number, reason?: string) => void
  setStockAlerts: (alerts: StockAlert[]) => void
  dismissAlert: (alertId: string) => void
  
  // Filters & Search
  setSearchTerm: (term: string) => void
  setFilterCategory: (categoryId: string) => void
  setFilterBrand: (brandId: string) => void
  setSortBy: (sortBy: 'name' | 'price' | 'stock' | 'created') => void
  setSortDirection: (direction: 'asc' | 'desc') => void
  clearFilters: () => void
  
  // Computed
  getFilteredProducts: () => ProductWithRelations[]
  getLowStockProducts: () => ProductWithRelations[]
  getOutOfStockProducts: () => ProductWithRelations[]
  getTotalValue: () => number
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      // Initial State
      products: [],
      selectedProduct: null,
      categories: [],
      brands: [],
      stockAlerts: [],
      isLoading: false,
      searchTerm: '',
      filterCategory: '',
      filterBrand: '',
      sortBy: 'name',
      sortDirection: 'asc',
      
      // Actions
      initialize: () => {
        // Initialize store - can be used to load data from API
        set({ isLoading: false })
      },
      
      setProducts: (products) => set({ products }),
      
      addProduct: (product) => set((state) => ({
        products: [...state.products, product]
      })),
      
      updateProduct: (id, updatedProduct) => set((state) => ({
        products: state.products.map(product =>
          product.id === id ? { ...product, ...updatedProduct } : product
        )
      })),
      
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(product => product.id !== id),
        selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct
      })),
      
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      
      // Categories & Brands
      setCategories: (categories) => set({ categories }),
      setBrands: (brands) => set({ brands }),
      
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, category]
      })),
      
      addBrand: (brand) => set((state) => ({
        brands: [...state.brands, brand]
      })),
      
      // Stock Management
      updateStock: (productId, newStock, reason) => set((state) => ({
        products: state.products.map(product =>
          product.id === productId
            ? { ...product, currentStock: newStock }
            : product
        )
      })),
      
      setStockAlerts: (alerts) => set({ stockAlerts: alerts }),
      
      dismissAlert: (alertId) => set((state) => ({
        stockAlerts: state.stockAlerts.filter(alert => alert.id !== alertId)
      })),
      
      // Filters & Search
      setSearchTerm: (term) => set({ searchTerm: term }),
      setFilterCategory: (categoryId) => set({ filterCategory: categoryId }),
      setFilterBrand: (brandId) => set({ filterBrand: brandId }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortDirection: (direction) => set({ sortDirection: direction }),
      
      clearFilters: () => set({
        searchTerm: '',
        filterCategory: '',
        filterBrand: '',
        sortBy: 'name',
        sortDirection: 'asc'
      }),
      
      // Computed
      getFilteredProducts: () => {
        const state = get()
        let filtered = [...state.products]
        
        // Search filter
        if (state.searchTerm) {
          const searchLower = state.searchTerm.toLowerCase()
          filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower) ||
            product.sku.toLowerCase().includes(searchLower) ||
            product.barcode?.toLowerCase().includes(searchLower)
          )
        }
        
        // Category filter
        if (state.filterCategory) {
          filtered = filtered.filter(product => product.categoryId === state.filterCategory)
        }
        
        // Brand filter
        if (state.filterBrand) {
          filtered = filtered.filter(product => product.brandId === state.filterBrand)
        }
        
        // Sort
        filtered.sort((a, b) => {
          let aValue: any, bValue: any
          
          switch (state.sortBy) {
            case 'name':
              aValue = a.name.toLowerCase()
              bValue = b.name.toLowerCase()
              break
            case 'price':
              aValue = Number(a.sellingPrice)
              bValue = Number(b.sellingPrice)
              break
            case 'stock':
              aValue = a.currentStock
              bValue = b.currentStock
              break
            case 'created':
              aValue = new Date(a.createdAt)
              bValue = new Date(b.createdAt)
              break
            default:
              return 0
          }
          
          if (aValue < bValue) return state.sortDirection === 'asc' ? -1 : 1
          if (aValue > bValue) return state.sortDirection === 'asc' ? 1 : -1
          return 0
        })
        
        return filtered
      },
      
      getLowStockProducts: () => {
        const state = get()
        return state.products.filter(product => 
          product.currentStock <= product.minStockLevel && product.currentStock > 0
        )
      },
      
      getOutOfStockProducts: () => {
        const state = get()
        return state.products.filter(product => product.currentStock === 0)
      },
      
      getTotalValue: () => {
        const state = get()
        return state.products.reduce((total, product) => {
          return total + (Number(product.costPrice) * product.currentStock)
        }, 0)
      },
    }),
    {
      name: 'inventory-store',
      partialize: (state) => ({
        // Only persist essential data, not UI state
        searchTerm: state.searchTerm,
        filterCategory: state.filterCategory,
        filterBrand: state.filterBrand,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
      })
    }
  )
)
