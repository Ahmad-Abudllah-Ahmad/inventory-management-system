import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Define types locally since Prisma client may not be generated yet
export interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  salePrice: number
  costPrice: number
  currentStock: number
  category: { name: string }
  brand: { name: string }
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
}

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_PAYMENT' | 'BANK_TRANSFER' | 'CREDIT'

export interface CartItem {
  id: string
  product: Product
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface POSCustomer {
  id?: string
  firstName: string
  lastName?: string
  phone: string
  email?: string
}

interface POSState {
  // Cart
  cartItems: CartItem[]
  selectedCustomer: POSCustomer | null
  
  // Totals
  subtotal: number
  discountAmount: number
  discountPercentage: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  
  // Payment
  paymentMethod: PaymentMethod
  amountPaid: number
  changeAmount: number
  
  // UI State
  isProcessing: boolean
  showCustomerModal: boolean
  showPaymentModal: boolean
  showReceiptModal: boolean
  
  // Current Sale
  currentSaleId: string | null
  lastSale: any | null
  
  // Actions
  initialize: () => void
  
  // Cart Management
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  updateCartItemDiscount: (productId: string, discount: number) => void
  clearCart: () => void
  
  // Customer Management
  setSelectedCustomer: (customer: POSCustomer | null) => void
  
  // Discount & Tax
  setDiscountAmount: (amount: number) => void
  setDiscountPercentage: (percentage: number) => void
  setTaxRate: (rate: number) => void
  
  // Payment
  setPaymentMethod: (method: PaymentMethod) => void
  setAmountPaid: (amount: number) => void
  
  // UI Actions
  setShowCustomerModal: (show: boolean) => void
  setShowPaymentModal: (show: boolean) => void
  setShowReceiptModal: (show: boolean) => void
  
  // Sale Actions
  processSale: () => Promise<boolean>
  completeSale: (saleData: any) => void
  
  // Calculations
  calculateTotals: () => void
  getCartItemCount: () => number
  
  // Quick Actions
  addQuickProduct: (barcode: string) => Promise<boolean>
  applyQuickDiscount: (percentage: number) => void
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      // Initial State
      cartItems: [],
      selectedCustomer: null,
      subtotal: 0,
      discountAmount: 0,
      discountPercentage: 0,
      taxRate: 17, // Default GST rate in Pakistan
      taxAmount: 0,
      totalAmount: 0,
      paymentMethod: 'CASH',
      amountPaid: 0,
      changeAmount: 0,
      isProcessing: false,
      showCustomerModal: false,
      showPaymentModal: false,
      showReceiptModal: false,
      currentSaleId: null,
      lastSale: null,
      
      // Actions
      initialize: () => {
        const state = get()
        state.calculateTotals()
      },
      
      // Cart Management
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.cartItems.find(item => item.product.id === product.id)
          
          let newCartItems: CartItem[]
          
          if (existingItem) {
            // Update existing item
            newCartItems = state.cartItems.map(item =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                    subtotal: (item.quantity + quantity) * (Number(item.unitPrice) - item.discount)
                  }
                : item
            )
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `cart-${Date.now()}-${Math.random()}`,
              product,
              quantity,
              unitPrice: Number(product.salePrice),
              discount: 0,
              subtotal: quantity * Number(product.salePrice)
            }
            newCartItems = [...state.cartItems, newItem]
          }
          
          return { cartItems: newCartItems }
        })
        
        get().calculateTotals()
      },
      
      removeFromCart: (productId) => {
        set((state) => ({
          cartItems: state.cartItems.filter(item => item.product.id !== productId)
        }))
        get().calculateTotals()
      },
      
      updateCartItemQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }
        
        set((state) => ({
          cartItems: state.cartItems.map(item =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity,
                  subtotal: quantity * (item.unitPrice - item.discount)
                }
              : item
          )
        }))
        get().calculateTotals()
      },
      
      updateCartItemDiscount: (productId, discount) => {
        set((state) => ({
          cartItems: state.cartItems.map(item =>
            item.product.id === productId
              ? {
                  ...item,
                  discount,
                  subtotal: item.quantity * (item.unitPrice - discount)
                }
              : item
          )
        }))
        get().calculateTotals()
      },
      
      clearCart: () => {
        set({
          cartItems: [],
          selectedCustomer: null,
          discountAmount: 0,
          discountPercentage: 0,
          amountPaid: 0,
          changeAmount: 0,
          currentSaleId: null
        })
        get().calculateTotals()
      },
      
      // Customer Management
      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
      
      // Discount & Tax
      setDiscountAmount: (amount) => {
        set({ discountAmount: amount, discountPercentage: 0 })
        get().calculateTotals()
      },
      
      setDiscountPercentage: (percentage) => {
        set({ discountPercentage: percentage, discountAmount: 0 })
        get().calculateTotals()
      },
      
      setTaxRate: (rate) => {
        set({ taxRate: rate })
        get().calculateTotals()
      },
      
      // Payment
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      
      setAmountPaid: (amount) => {
        const state = get()
        const change = amount - state.totalAmount
        set({ 
          amountPaid: amount,
          changeAmount: change > 0 ? change : 0
        })
      },
      
      // UI Actions
      setShowCustomerModal: (show) => set({ showCustomerModal: show }),
      setShowPaymentModal: (show) => set({ showPaymentModal: show }),
      setShowReceiptModal: (show) => set({ showReceiptModal: show }),
      
      // Sale Actions
      processSale: async () => {
        const state = get()
        
        if (state.cartItems.length === 0) {
          return false
        }
        
        set({ isProcessing: true })
        
        try {
          const saleData = {
            items: state.cartItems.map(item => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              totalPrice: item.subtotal
            })),
            customerId: state.selectedCustomer?.id,
            subtotal: state.subtotal,
            discountAmount: state.discountAmount || (state.subtotal * state.discountPercentage / 100),
            taxAmount: state.taxAmount,
            totalAmount: state.totalAmount,
            paymentMethod: state.paymentMethod,
            amountPaid: state.amountPaid
          }
          
          const response = await fetch('/api/sales', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(saleData),
          })
          
          if (response.ok) {
            const result = await response.json()
            set({ 
              currentSaleId: result.sale.id,
              lastSale: result.sale,
              showReceiptModal: true,
              isProcessing: false
            })
            get().clearCart()
            return true
          } else {
            set({ isProcessing: false })
            return false
          }
        } catch (error) {
          console.error('Sale processing error:', error)
          set({ isProcessing: false })
          return false
        }
      },
      
      completeSale: (saleData) => {
        set({
          lastSale: saleData,
          currentSaleId: saleData.id
        })
        get().clearCart()
      },
      
      // Calculations
      calculateTotals: () => {
        const state = get()
        const subtotal = state.cartItems.reduce((total, item) => total + item.subtotal, 0)
        
        let discountAmount = state.discountAmount
        if (state.discountPercentage > 0) {
          discountAmount = subtotal * (state.discountPercentage / 100)
        }
        
        const afterDiscount = subtotal - discountAmount
        const taxAmount = afterDiscount * (state.taxRate / 100)
        const totalAmount = afterDiscount + taxAmount
        
        set({
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount
        })
      },
      
      getCartItemCount: () => {
        const state = get()
        return state.cartItems.reduce((total, item) => total + item.quantity, 0)
      },
      
      // Quick Actions
      addQuickProduct: async (barcode) => {
        try {
          const response = await fetch(`/api/products/barcode/${barcode}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.product) {
              const product = data.product
              const mappedProduct: Product = {
                id: product.id,
                name: product.name,
                sku: product.sku,
                salePrice: typeof product.sellingPrice?.toNumber === 'function' 
                  ? product.sellingPrice.toNumber() 
                  : Number(product.sellingPrice),
                costPrice: typeof product.costPrice?.toNumber === 'function' 
                  ? product.costPrice.toNumber() 
                  : Number(product.costPrice),
                currentStock: product.currentStock,
                category: { name: product.category?.name || product.category?.id || 'Accessories' },
                brand: { name: product.brand?.name || 'Unknown' },
                ...(product.barcode ? { barcode: product.barcode } : {})
              }
              get().addToCart(mappedProduct)
              return true
            }
          }
          return false
        } catch (error) {
          console.error('Quick product add error:', error)
          return false
        }
      },
      
      applyQuickDiscount: (percentage) => {
        get().setDiscountPercentage(percentage)
      },
    }),
    {
      name: 'pos-store',
      partialize: (state) => ({
        // Only persist cart items and basic settings
        cartItems: state.cartItems,
        selectedCustomer: state.selectedCustomer,
        taxRate: state.taxRate,
        paymentMethod: state.paymentMethod,
      })
    }
  )
)
