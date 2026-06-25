'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/components/providers/auth-provider'
import { useUIStore } from '@/store/ui-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  RefreshCw,
  Printer
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
}

function InvoicePreviewModal({ isOpen, onClose, order }: InvoicePreviewModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !order || !mounted) return null

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.saleNumber}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                color: #1f2937;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
              }
              .meta {
                text-align: right;
                font-size: 14px;
                color: #4b5563;
              }
              .details {
                margin-bottom: 30px;
                font-size: 14px;
              }
              .details table {
                width: 100%;
              }
              .details td {
                padding: 4px 0;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              .items-table th {
                background-color: #f3f4f6;
                text-align: left;
                padding: 10px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #4b5563;
              }
              .items-table td {
                padding: 12px 10px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
              }
              .summary {
                display: flex;
                justify-content: flex-end;
              }
              .summary-box {
                width: 300px;
                font-size: 14px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
              }
              .summary-total {
                font-size: 18px;
                font-weight: bold;
                border-top: 2px solid #e5e7eb;
                padding-top: 10px;
                margin-top: 10px;
                color: #111827;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px dashed #e5e7eb;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">AL UMER MOBILE</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Premium Mobile & Accessories Store</div>
              </div>
              <div class="meta">
                <div style="font-weight: bold; font-size: 16px;">INVOICE</div>
                <div style="margin-top: 6px;">Invoice #: ${order.saleNumber}</div>
                <div>Date: ${new Date(order.time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            </div>

            <div class="details">
              <table style="width: 100%;">
                <tr>
                  <td style="width: 50%; vertical-align: top;">
                    <div style="font-weight: bold; color: #4b5563; margin-bottom: 4px;">CUSTOMER DETAILS</div>
                    <div style="font-size: 15px; font-weight: 500;">${order.customerName}</div>
                    ${order.customerPhone ? `<div style="color: #6b7280; margin-top: 2px;">Phone: ${order.customerPhone}</div>` : ''}
                  </td>
                  <td style="width: 50%; vertical-align: top; text-align: right;">
                    <div style="font-weight: bold; color: #4b5563; margin-bottom: 4px;">PAYMENT METHOD</div>
                    <div style="font-size: 14px; font-weight: 500; text-transform: uppercase;">${order.paymentMethod || 'CASH'}</div>
                    <div style="margin-top: 4px;"><span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold;">PAID</span></div>
                    ${order.isRefunded ? `
                      <div style="margin-top: 6px;">
                        <span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; border: 1px solid #fca5a5;">
                          REFUNDED & RETURNED TO INVENTORY
                        </span>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map((item: any) => `
                  <tr>
                    <td>
                      <div style="font-weight: 500;">${item.productName}</div>
                      <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">SKU: ${item.productSku}</div>
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">Rs ${item.unitPrice.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; font-weight: 500;">Rs ${item.totalPrice.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>Rs ${(order.subtotal || order.total).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
                ${order.discountAmount > 0 ? `
                  <div class="summary-row" style="color: #dc2626;">
                    <span>Discount</span>
                    <span>-Rs ${order.discountAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                  </div>
                ` : ''}
                ${order.taxAmount > 0 ? `
                  <div class="summary-row">
                    <span>Tax</span>
                    <span>Rs ${order.taxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                  </div>
                ` : ''}
                <div class="summary-row summary-total">
                  <span>Grand Total</span>
                  <span>Rs ${order.total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for shopping at Al Umer Mobile!</p>
              <p style="font-size: 10px; margin-top: 8px;">Software Generated Invoice • No signature required</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-foreground">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-muted/30 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-905 dark:text-white">Invoice Preview</h3>
            <p className="text-xs text-muted-foreground">Order ID: {order.saleNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-655 dark:hover:text-gray-300 focus:outline-none text-xl font-semibold"
          >
            &times;
          </button>
        </div>

        {/* Printable Area Container */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-800 dark:text-gray-200 animate-fade-in" id="invoice-print-area">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-blue-600 font-sans">AL UMER MOBILE</h2>
              <p className="text-xs text-gray-500 mt-1">Premium Mobile & Accessories Store</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase tracking-wider font-semibold">
                Paid
              </span>
              {order.isRefunded && (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase tracking-wider font-semibold border border-red-200">
                  Refunded & Returned to Inventory
                </span>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(order.time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
 
          {/* Customer / Transaction Details */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="font-bold text-gray-400 text-xs uppercase tracking-wider">Customer Details</p>
              <p className="font-semibold mt-1">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-xs text-gray-500 mt-1">Phone: {order.customerPhone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-400 text-xs uppercase tracking-wider">Payment Info</p>
              <p className="font-semibold mt-1 uppercase">{order.paymentMethod || 'CASH'}</p>
              <p className="text-xs text-gray-500 mt-1">Status: {order.isRefunded ? 'Refunded & Returned to Inventory' : 'Completed'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700 dark:text-gray-300">
                {order.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                    <td className="p-3">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">SKU: {item.productSku}</p>
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="flex justify-end text-sm">
            <div className="w-64 space-y-2 border-t pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal || order.total)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                <span>Grand Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-muted/20 border-t flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function Header() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const {
    sidebarCollapsed,
    setMobileMenuOpen,
    notifications,
    getUnreadNotificationCount,
    globalSearch,
    setGlobalSearch
  } = useUIStore()
  
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<{ products: any[]; customers: any[]; sales: any[] }>({ products: [], customers: [], sales: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState<any | null>(null)
  const unreadCount = getUnreadNotificationCount()

  // Debounced Search API querying
  useEffect(() => {
    const fetchResults = async () => {
      if (!globalSearch || globalSearch.trim().length < 2) {
        setSearchResults({ products: [], customers: [], sales: [] })
        return
      }

      try {
        setSearchLoading(true)
        const res = await fetch(`/api/search?q=${encodeURIComponent(globalSearch)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults({
            products: data.products || [],
            customers: data.customers || [],
            sales: data.sales || [],
          })
        }
      } catch (err) {
        console.error('Error fetching search results:', err)
      } finally {
        setSearchLoading(false)
      }
    }

    const delayDebounce = setTimeout(() => {
      fetchResults()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [globalSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleItemClick = (href: string) => {
    setGlobalSearch('')
    setShowResults(false)
    router.push(href)
  }

  return (
    <header 
      className={`fixed top-0 right-0 left-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border transition-all duration-200 ${
        sidebarCollapsed ? 'lg:left-[112px]' : 'lg:left-72'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className={`flex items-center transition-all duration-200 ${
              searchFocused ? 'w-64 lg:w-96' : 'w-48 lg:w-64'
            }`}>
              <Search className="absolute left-3 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search products, customers, invoices..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value)
                  setShowResults(true)
                }}
                onFocus={() => {
                  setSearchFocused(true)
                  setShowResults(true)
                }}
                onBlur={() => {
                  setSearchFocused(false)
                  setTimeout(() => setShowResults(false), 200)
                }}
                className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
              />
            </div>

            {/* Global Search Results Dropdown */}
            {showResults && globalSearch.trim().length >= 2 && (
              <div className="absolute top-full left-0 mt-2 w-72 lg:w-96 bg-white dark:bg-gray-950 border border-border shadow-xl rounded-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto p-2">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin text-blue-600" />
                    Searching...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 1. Products Section (First) */}
                    {searchResults.products.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
                          Products
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.products.map((product: any) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleItemClick(`/dashboard/inventory/products?search=${encodeURIComponent(product.name)}`)}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex flex-col"
                            >
                              <span className="font-semibold text-xs text-gray-900 dark:text-white">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                Stock: {product.currentStock} • Price: {formatCurrency(product.sellingPrice)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Invoices Section (Second) */}
                    {searchResults.sales.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
                          Invoices & Sales
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.sales.map((sale: any) => (
                            <button
                              key={sale.id}
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceForPreview(sale)
                                setShowResults(false)
                                setGlobalSearch('')
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex flex-col"
                            >
                              <span className="font-semibold text-xs text-gray-900 dark:text-white">
                                {sale.saleNumber}
                              </span>
                              <span className="text-[10px] text-gray-500 truncate">
                                {sale.customerName} • PKR {sale.total.toLocaleString()}
                              </span>
                              {sale.items && sale.items.length > 0 && (
                                <span className="text-[9px] text-gray-400 truncate">
                                  Items: {sale.items.map((it: any) => it.productName).join(', ')}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Customers Section (Third) */}
                    {searchResults.customers.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
                          Customers
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.customers.map((c: any) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleItemClick(`/dashboard/customers?search=${encodeURIComponent(c.name)}`)}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex flex-col"
                            >
                              <span className="font-semibold text-xs text-gray-900 dark:text-white">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {c.phone} {c.email ? `• ${c.email}` : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.products.length === 0 && searchResults.sales.length === 0 && searchResults.customers.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground flex flex-col items-center">
                        <Search className="w-8 h-8 text-gray-300 mb-2" />
                        No matching products, invoices, or customers found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                      <div className="flex items-center w-full">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No new notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  {user && user.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '')}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Invoice Preview Modal Popup overlay */}
      {selectedInvoiceForPreview && (
        <InvoicePreviewModal
          isOpen={!!selectedInvoiceForPreview}
          onClose={() => setSelectedInvoiceForPreview(null)}
          order={selectedInvoiceForPreview}
        />
      )}
    </header>
  )
}
