'use client'

import { useEffect } from 'react'
import { Oswald } from 'next/font/google'
const oswald = Oswald({ subsets: ['latin'], weight: ['200', '700'] })
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Receipt,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Package2,
  CreditCard,
  BarChart3,
  UserCheck,
  ClipboardList,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserRound
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  },
  {
    name: 'POS System',
    href: '/dashboard/pos',
    icon: CreditCard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'],
  },
  {
    name: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    children: [
      { name: 'Products', href: '/dashboard/inventory/products', icon: Package2 },
      { name: 'Categories', href: '/dashboard/inventory/categories', icon: Package },
      { name: 'Stock Alerts', href: '/dashboard/inventory/alerts', icon: AlertTriangle },
    ],
  },
  {
    name: 'Sales',
    href: '/dashboard/sales',
    icon: Receipt,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'],
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  },
  {
    name: 'Purchase',
    href: '/dashboard/purchases',
    icon: ShoppingCart,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    children: [
      { name: 'Sales Reports', href: '/dashboard/reports/sales', icon: TrendingUp },
      { name: 'Inventory Reports', href: '/dashboard/reports/inventory', icon: Package },
      { name: 'Financial Reports', href: '/dashboard/reports/financial', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: UserCheck,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    name: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: ClipboardList,
    roles: ['SUPER_ADMIN'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { 
    sidebarCollapsed, 
    mobileMenuOpen, 
    setSidebarCollapsed, 
    setMobileMenuOpen 
  } = useUIStore()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, setMobileMenuOpen])

  const hasAccess = (roles: string[]) => {
    return user && roles.includes(user.role)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Brand Logo in the corner of the screen */}
      <div 
        className="fixed top-6 left-8 z-50 hidden lg:flex items-center cursor-pointer"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {!sidebarCollapsed && (
          <div>
            <h1 className={cn("text-4xl text-gray-900 dark:text-white font-extralight", oswald.className)}>fourty<span className="font-bold">1</span></h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inventory & POS</p>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed left-4 z-50 h-fit max-h-[calc(100vh-2rem)] bg-white border border-border shadow-lg rounded-[20px] transition-all duration-200 hidden lg:flex flex-col top-1/2 -translate-y-1/2",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo Header */}
        <div className={cn(
          "flex items-center border-b border-border p-4 h-16 relative",
          sidebarCollapsed ? "justify-center" : "justify-end"
        )}>
          {!sidebarCollapsed && <div className="h-8" />}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              sidebarCollapsed 
                ? "w-6 h-6 flex items-center justify-center text-gray-500 p-0" 
                : "ml-auto"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (!hasAccess(item.roles)) return null

            const isItemActive = isActive(item.href)

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isItemActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
                
                {/* Sub-navigation */}
                {item.children && isItemActive && (
                  <div className={cn(
                    "mt-1 space-y-1",
                    sidebarCollapsed ? "flex flex-col items-center gap-1 py-1" : "ml-8"
                  )}>
                    {item.children
                      .filter((child: any) => !child.roles || (user && child.roles.includes(user.role)))
                      .map((child) => (
                        <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "flex items-center transition-colors rounded-lg",
                          sidebarCollapsed
                            ? "p-1.5 hover:bg-gray-100 justify-center w-8 h-8"
                            : "space-x-3 px-3 py-2 text-sm font-medium w-full",
                          isActive(child.href)
                            ? sidebarCollapsed
                              ? "bg-blue-50 text-blue-600"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400"
                            : sidebarCollapsed
                              ? "text-gray-400 hover:text-gray-600"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800/50"
                        )}
                        title={sidebarCollapsed ? child.name : undefined}
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span>{child.name}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-border p-2">
          {!sidebarCollapsed && user && (
            <div className="px-3 py-2 text-sm">
              <div className="font-medium text-gray-900 dark:text-white">
                {(user.firstName || '') + ' ' + (user.lastName || '')}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size={sidebarCollapsed ? "icon" : "sm"}
            onClick={logout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border transform transition-transform duration-200 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center">
            <div>
              <h1 className={cn("text-4xl text-gray-900 font-extralight", oswald.className)}>fourty<span className="font-bold">1</span></h1>
              <p className="text-sm text-gray-500 mt-1">Inventory & POS</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (!hasAccess(item.roles)) return null

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
                
                {/* Mobile Sub-navigation */}
                {item.children && isActive(item.href) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children
                      .filter((child: any) => !child.roles || (user && child.roles.includes(user.role)))
                      .map((child) => (
                        <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive(child.href)
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Mobile User Profile & Logout */}
        <div className="border-t border-border p-2">
          {user && (
            <div className="px-3 py-2 text-sm">
              <div className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-gray-500">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="ml-3">Logout</span>
          </Button>
        </div>
      </div>
    </>
  )
}
