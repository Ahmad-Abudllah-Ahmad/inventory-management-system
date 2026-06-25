'use client'

import { useState, useEffect } from 'react'
import { usePOSStore } from '@/store/pos-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard, 
  Scan,
  Search,
  Package,
  Calculator,
  Receipt,
  X,
  Printer,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  UserPlus
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

import { type Product as POSProduct } from '@/store/pos-store';

// Mock products for POS
const mockProducts = [
  {
    id: '1',
    name: 'iPhone 14 Pro Case - Clear',
    sku: 'IP14PC-CLR',
    barcode: '1234567890123',
    sellingPrice: 2500,
    costPrice: 1500,
    currentStock: 25,
    minStockLevel: 5,
    maxStockLevel: 100,
    reservedStock: 0,
    categoryId: 'cat1',
    brandId: 'brand1',
    isActive: true,
    isFeatured: false,
    description: 'Premium clear case for iPhone 14 Pro',
    images: [],
    specifications: null,
    warranty: 12,
    tags: ['case', 'iphone', 'clear'],
    weight: 0.05,
    dimensions: null,
    createdById: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat1', name: 'Cases', description: '', image: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    brand: { id: 'brand1', name: 'Apple', logo: null, website: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
  },
  {
    id: '2',
    name: 'Samsung Galaxy S23 Tempered Glass',
    sku: 'SG23TG-CLR',
    barcode: '1234567890124',
    sellingPrice: 1200,
    costPrice: 600,
    currentStock: 45,
    minStockLevel: 10,
    maxStockLevel: 100,
    reservedStock: 0,
    categoryId: 'cat2',
    brandId: 'brand2',
    isActive: true,
    isFeatured: true,
    description: '9H hardness tempered glass screen protector',
    images: [],
    specifications: null,
    warranty: 6,
    tags: ['screen protector', 'samsung', 'tempered glass'],
    weight: 0.02,
    dimensions: null,
    createdById: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat2', name: 'Screen Protectors', description: '', image: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    brand: { id: 'brand2', name: 'Samsung', logo: null, website: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
  },
  {
    id: '3',
    name: 'Power Bank 20000mAh Fast Charge',
    sku: 'PB20K-FC',
    barcode: '1234567890125',
    sellingPrice: 4500,
    costPrice: 3000,
    currentStock: 15,
    minStockLevel: 5,
    maxStockLevel: 50,
    reservedStock: 0,
    categoryId: 'cat3',
    brandId: 'brand3',
    isActive: true,
    isFeatured: true,
    description: 'High capacity power bank with fast charging',
    images: [],
    specifications: null,
    warranty: 24,
    tags: ['power bank', 'charging', 'portable'],
    weight: 0.4,
    dimensions: null,
    createdById: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat3', name: 'Accessories', description: '', image: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    brand: { id: 'brand3', name: 'Anker', logo: null, website: null, isActive: true, createdAt: new Date(), updatedAt: new Date() }
  }
]

// Mock customers list
const mockPOSCustomers = [
  { id: '1', firstName: 'Ahmad', lastName: 'Ali', phone: '+92-300-1234567', email: 'ahmad.ali@email.com' },
  { id: '2', firstName: 'Sarah', lastName: 'Khan', phone: '+92-301-2345678', email: 'sarah.khan@email.com' },
  { id: '3', firstName: 'Muhammad', lastName: 'Hassan', phone: '+92-302-3456789', email: 'm.hassan@email.com' }
]

export default function POSPage() {
  const {
    cartItems,
    selectedCustomer,
    subtotal,
    discountAmount,
    discountPercentage,
    taxAmount,
    totalAmount,
    paymentMethod,
    amountPaid,
    changeAmount,
    isProcessing,
    showCustomerModal,
    showPaymentModal,
    showReceiptModal,
    lastSale,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    setDiscountAmount,
    setDiscountPercentage,
    setPaymentMethod,
    setAmountPaid,
    setShowCustomerModal,
    setShowPaymentModal,
    setShowReceiptModal,
    setSelectedCustomer,
    processSale,
    clearCart,
    getCartItemCount
  } = usePOSStore()

  // Local UI State
  // Local UI State
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([{ id: 'all', name: 'All Products' }])
  const [customersList, setCustomersList] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')

  // New Customer Form State
  const [newCustFirstName, setNewCustFirstName] = useState('')
  const [newCustLastName, setNewCustLastName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)

  // Fetch Categories on Load
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories?limit=100')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            setCategories([
              { id: 'all', name: 'All Products' },
              ...data.data.map((c: any) => ({ id: c.id, name: c.name }))
            ])
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch Products based on search and category
  useEffect(() => {
    async function fetchProducts() {
      setLoadingProducts(true)
      try {
        let url = `/api/products?limit=100`
        if (selectedCategory && selectedCategory !== 'all') {
          url += `&categoryId=${selectedCategory}`
        }
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`
        }
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            setProducts(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoadingProducts(false)
      }
    }

    const delayDebounce = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchTerm, selectedCategory])

  // Fetch Customers based on search query
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            setCustomersList(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error)
      }
    }

    const delayDebounce = setTimeout(() => {
      fetchCustomers()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [customerSearch])

  // Automatically trigger printing when showReceiptModal is true and lastSale is set
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (showReceiptModal && lastSale) {
      timer = setTimeout(() => {
        const printContent = document.getElementById('print-receipt-content');
        if (printContent) {
          const originalContent = document.body.innerHTML;
          document.body.innerHTML = printContent.innerHTML;
          window.print();
          document.body.innerHTML = originalContent;
          window.location.reload();
        }
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showReceiptModal, lastSale]);

  // Filtered lists
  const filteredProducts = products
  const filteredCustomers = customersList

  const handleAddToCart = (product: any) => {
    if (product.currentStock <= 0) {
      toast.error('Product is out of stock')
      return
    }
    
    const mappedProduct: POSProduct = {
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
    
    addToCart(mappedProduct)
    toast.success(`${product.name} added to cart`)
  }

  const handleProcessSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const success = await processSale()
    if (success) {
      toast.success('Sale completed successfully!')
      setShowPaymentModal(false)
    } else {
      toast.error('Failed to process sale')
    }
  }

  const handleQuickPayment = (amount: number) => {
    setAmountPaid(amount)
    setPaymentMethod('CASH')
    setShowPaymentModal(true)
  }

  // Handle barcode scanner submission
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput) return
    try {
      const response = await fetch(`/api/products/barcode/${barcodeInput}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.product) {
          const product = data.product
          handleAddToCart(product)
          setBarcodeInput('')
          setShowBarcodeScanner(false)
          return
        }
      }
      toast.error('Product not found for scanned code')
    } catch (err) {
      console.error(err)
      toast.error('Error fetching scanned product')
    }
  }

  // Handle adding a new customer in modal
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustFirstName || !newCustPhone) {
      toast.error('First Name and Phone are required')
      return
    }
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: newCustFirstName,
          lastName: newCustLastName,
          phone: newCustPhone,
          email: newCustEmail,
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        const newCust = data.customer
        setCustomersList(prev => [...prev, newCust])
        setSelectedCustomer(newCust)
        toast.success('New customer registered!')
        
        // Clear form
        setNewCustFirstName('')
        setNewCustLastName('')
        setNewCustPhone('')
        setNewCustEmail('')
        setShowNewCustomerForm(false)
        setShowCustomerModal(false)
      } else {
        toast.error(data.error || 'Failed to register customer')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error registering customer')
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Search and Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products by name, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBarcodeScanner(true)}
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Scan Barcode
                </Button>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-4 flex flex-col h-full justify-between">
                  <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center border border-dashed border-gray-200">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-gray-800">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">
                      SKU: {product.sku}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="font-bold text-blue-600 text-sm">
                      {formatCurrency(Number(product.sellingPrice))}
                    </span>
                    <Badge variant={product.currentStock > product.minStockLevel ? "outline" : "destructive"}>
                      {product.currentStock} qty
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed">
              <Package className="w-12 h-12 mb-4 text-gray-300" />
              <p className="font-semibold">No products found</p>
              <p className="text-sm text-gray-400">Try adjusting your search query or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col">
        <Card className="flex-1 flex flex-col shadow-lg border border-gray-200 bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
                Cart ({getCartItemCount()})
              </div>
              {cartItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </CardTitle>
            
            {/* Customer Bar */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg">
              <div className="flex items-center text-gray-700">
                <User className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                <span className="font-medium">
                  {selectedCustomer 
                    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}` 
                    : 'Walk-in Customer'}
                </span>
              </div>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-blue-600 hover:text-blue-700 font-semibold"
                onClick={() => setShowCustomerModal(true)}
              >
                Change
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mb-3 text-gray-200" />
                  <p className="font-medium">Cart is empty</p>
                  <p className="text-xs text-gray-400">Click products on the left to add them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-xs text-gray-800 flex-1 pr-2 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 bg-white border border-gray-200 rounded-md p-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </Button>
                          
                          <span className="text-xs font-semibold w-6 text-center text-gray-800">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            disabled={item.quantity >= item.product.currentStock}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {formatCurrency(item.unitPrice)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              !showPaymentModal ? (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4">
                  {/* Discount selectors */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-gray-500 font-semibold mb-1 block">Discount %</Label>
                      <Input
                        type="number"
                        placeholder="%"
                        value={discountPercentage || ''}
                        onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-gray-500 font-semibold mb-1 block">Discount Amount</Label>
                      <Input
                        type="number"
                        placeholder="PKR"
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    
                    {(discountAmount > 0 || discountPercentage > 0) && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(discountAmount || (subtotal * discountPercentage / 100))}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Sales Tax (17%):</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 text-gray-900">
                      <span>Total Due:</span>
                      <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Quick Payment Options */}
                  <div className="space-y-2.5 pt-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPayment(totalAmount)}
                        className="text-xs h-8 hover:bg-blue-50"
                      >
                        Exact Cash
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPayment(Math.ceil(totalAmount / 100) * 100)}
                        className="text-xs h-8 hover:bg-blue-50"
                      >
                        Round Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPaymentMethod('CASH')
                          setShowPaymentModal(true)
                        }}
                        className="text-xs h-8 hover:bg-blue-50"
                      >
                        Other Pay
                      </Button>
                    </div>
                    
                    <Button
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
                      onClick={() => {
                        setPaymentMethod('CASH')
                        setShowPaymentModal(true)
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Calculator className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Receipt className="w-4 h-4 mr-2" />
                          Proceed to Checkout
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4">
                  {/* POS Checkout Setup Header */}
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">POS Checkout Setup</h3>
                    <p className="text-[10px] text-gray-500">Configure payment method and register amount paid.</p>
                  </div>

                  {/* Payment Option Buttons */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-gray-500 font-semibold">Payment Option</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'CASH', label: '💸 Cash' },
                        { id: 'CARD', label: '💳 Credit/Debit Card' },
                        { id: 'MOBILE_PAYMENT', label: '📱 Mobile Payment' },
                        { id: 'BANK_TRANSFER', label: '🏦 Bank Wire' }
                      ].map((methodOption) => (
                        <button
                          key={methodOption.id}
                          type="button"
                          onClick={() => setPaymentMethod(methodOption.id as any)}
                          className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                            paymentMethod === methodOption.id
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {methodOption.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total Bill Details */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-gray-500 font-medium">Total Bill:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                  </div>

                  {/* Amount Paid Input */}
                  <div className="space-y-1">
                    <Label htmlFor="pay-amt" className="text-[10px] text-gray-500 font-semibold">Cash / Amount Paid *</Label>
                    <Input
                      id="pay-amt"
                      type="number"
                      placeholder="0.00"
                      value={amountPaid || ''}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="h-8 text-xs font-bold bg-white"
                    />
                  </div>

                  {/* Change Calculation */}
                  <div className="flex justify-between items-center text-xs py-1 border-t border-b border-dashed border-gray-200">
                    <span className="text-gray-500">Change Due:</span>
                    <span className={`font-bold ${changeAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {formatCurrency(changeAmount)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowPaymentModal(false)}
                      className="text-xs h-9"
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleProcessSale}
                      disabled={isProcessing || amountPaid < totalAmount}
                      className="bg-blue-600 hover:bg-blue-700 font-semibold text-xs h-9 text-white"
                    >
                      {isProcessing ? 'Processing...' : 'Proceed'}
                    </Button>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* ----------------- DIALOG OVERLAYS ----------------- */}

      {/* 1. Barcode Scanner Simulator Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-sm mx-4 bg-white shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="relative">
              <CardTitle className="text-lg flex items-center">
                <Scan className="w-5 h-5 mr-2 text-blue-500" />
                Barcode Scanner
              </CardTitle>
              <CardDescription>
                Simulate a laser scan by entering the barcode or SKU.
              </CardDescription>
              <button 
                onClick={() => setShowBarcodeScanner(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleBarcodeSubmit}>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden h-32">
                  <Scan className="w-12 h-12 text-gray-300 animate-pulse" />
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500/80 top-1/2 -translate-y-1/2 animate-bounce"></div>
                  <span className="text-[10px] text-gray-400 mt-2">Position barcode in view</span>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="barcode-input" className="text-xs font-semibold">Scan / Type SKU or Barcode</Label>
                  <Input 
                    id="barcode-input"
                    placeholder="e.g. 1234567890123"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-400">
                    Try mock codes: <code className="font-semibold text-gray-600">1234567890123</code> (iPhone Case) or <code className="font-semibold text-gray-600">1234567890124</code> (Samsung Glass)
                  </p>
                </div>
              </CardContent>
              <div className="p-4 border-t border-gray-100 flex justify-end space-x-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowBarcodeScanner(false)}>
                  Close
                </Button>
                <Button size="sm" type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Add Product
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Customer Selector / Register Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 bg-white shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <CardHeader className="relative border-b border-gray-100 pb-3 flex-shrink-0">
              <CardTitle className="text-lg flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                {showNewCustomerForm ? 'Register New Customer' : 'Select Customer'}
              </CardTitle>
              <CardDescription>
                {showNewCustomerForm ? 'Add client details to database.' : 'Select a customer to reward loyalty points.'}
              </CardDescription>
              <button 
                onClick={() => {
                  setShowCustomerModal(false)
                  setShowNewCustomerForm(false)
                }}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            {/* List Mode */}
            {!showNewCustomerForm ? (
              <>
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search name or phone number..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setShowCustomerModal(false)
                      toast.success('Switched to Walk-in Customer')
                    }}
                    className="w-full text-left p-3 rounded-lg border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-800">Walk-in Customer</p>
                      <p className="text-xs text-gray-400">Default guest transaction</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  {filteredCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className={`p-3 rounded-lg border flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-all ${
                        selectedCustomer?.id === cust.id ? 'border-blue-500 bg-blue-50/20' : 'border-gray-100'
                      }`}
                      onClick={() => {
                        setSelectedCustomer(cust)
                        setShowCustomerModal(false)
                        toast.success(`Selected customer: ${cust.firstName}`)
                      }}
                    >
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{cust.firstName} {cust.lastName || ''}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center"><Phone className="w-3 h-3 mr-1" />{cust.phone}</span>
                          {cust.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{cust.email}</span>}
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 text-[10px]">Select</Badge>
                    </div>
                  ))}
                  
                  {filteredCustomers.length === 0 && (
                    <p className="text-center text-gray-400 py-6 text-sm">No customers matching search criteria.</p>
                  )}
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    onClick={() => setShowNewCustomerForm(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Create New Profile
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowCustomerModal(false)}>
                    Close
                  </Button>
                </div>
              </>
            ) : (
              /* Add New Profile Form Mode */
              <form onSubmit={handleCreateCustomer} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="cust-fn" className="text-xs font-semibold">First Name *</Label>
                      <Input
                        id="cust-fn"
                        placeholder="Ahmad"
                        value={newCustFirstName}
                        onChange={(e) => setNewCustFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cust-ln" className="text-xs font-semibold">Last Name</Label>
                      <Input
                        id="cust-ln"
                        placeholder="Abdullah"
                        value={newCustLastName}
                        onChange={(e) => setNewCustLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cust-phone" className="text-xs font-semibold">Phone Number *</Label>
                    <Input
                      id="cust-phone"
                      placeholder="+92-300-1234567"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cust-email" className="text-xs font-semibold">Email Address</Label>
                    <Input
                      id="cust-email"
                      type="email"
                      placeholder="client@gmail.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-2 flex-shrink-0">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowNewCustomerForm(false)}>
                    Back to List
                  </Button>
                  <Button size="sm" type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Save Profile
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}



      {/* 4. Receipt / Invoice Print Modal */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-sm mx-4 bg-white shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Printable Area Wrapper */}
            <div id="print-receipt-content" className="p-6 bg-white text-black font-mono text-xs">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-gray-300">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-1">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <h2 className="font-bold text-sm uppercase">Al Umer Mobile Store</h2>
                <p className="text-[10px] text-gray-500">Hall Road, Lahore, Pakistan</p>
                <p className="text-[10px] text-gray-500">Tel: +92-300-9876543</p>
              </div>

              <div className="space-y-1.5 py-4 border-b border-dashed border-gray-300">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-bold">{lastSale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDate(lastSale.createdAt, 'PPp')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>
                    {lastSale.customer 
                      ? `${lastSale.customer.firstName} ${lastSale.customer.lastName || ''}` 
                      : 'Walk-in Guest'}
                  </span>
                </div>
                {lastSale.customer?.phone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{lastSale.customer.phone}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-4 border-b border-dashed border-gray-300 space-y-2">
                <div className="grid grid-cols-4 font-bold border-b border-dashed border-gray-200 pb-1">
                  <span className="col-span-2">Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {lastSale.items?.map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-4 text-[10px]">
                    <span className="col-span-2 truncate">{item.product?.name || 'Item'}</span>
                    <span className="text-center">{item.quantity}</span>
                    <span className="text-right">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              {/* Bill Details Summary */}
              <div className="py-4 border-b border-dashed border-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(lastSale.subtotal)}</span>
                </div>
                {Number(lastSale.discountAmount) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(lastSale.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Sales Tax (17%):</span>
                  <span>{formatCurrency(lastSale.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-200 pt-1.5">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(lastSale.totalAmount)}</span>
                </div>
              </div>

              <div className="py-4 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span>Pay Method:</span>
                  <span className="font-semibold">{lastSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Paid:</span>
                  <span>{formatCurrency(lastSale.amountPaid || lastSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change Return:</span>
                  <span>
                    {formatCurrency(
                      Math.max(0, (lastSale.amountPaid || lastSale.totalAmount) - lastSale.totalAmount)
                    )}
                  </span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-gray-300 text-[10px] text-gray-500 italic">
                <p>Thank you for shopping at Al Umer Mobile!</p>
                <p>No exchange/refund without invoice receipt.</p>
              </div>
            </div>

            {/* Print & Close Panel */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex space-x-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const printContent = document.getElementById('print-receipt-content');
                  const originalContent = document.body.innerHTML;
                  if (printContent) {
                    document.body.innerHTML = printContent.innerHTML;
                    window.print();
                    document.body.innerHTML = originalContent;
                    // Force complete reload to re-instantiate client react state correctly
                    window.location.reload();
                  }
                }}
                className="text-xs"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Receipt
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  clearCart()
                  setShowReceiptModal(false)
                  toast.success('Ready for next transaction!')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
              >
                Close & New Sale
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
