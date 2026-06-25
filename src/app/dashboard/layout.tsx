'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useUIStore } from '@/store/ui-store'
import { Loader2 } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarCollapsed, mobileMenuOpen } = useUIStore()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else if (user.role === 'STAFF') {
        const allowedPaths = ['/dashboard/pos', '/dashboard/sales'];
        const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
        if (!isAllowed) {
          router.push('/dashboard/pos');
        }
      } else if (user.role === 'MANAGER') {
        if (pathname === '/dashboard/reports/financial' || pathname.startsWith('/dashboard/reports/financial/')) {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div 
        className={`transition-all duration-200 print:ml-0 print:pt-0 ${
          sidebarCollapsed ? 'lg:ml-[112px]' : 'lg:ml-72'
        }`}
      >
        {/* Header */}
        <div className="print:hidden">
          <Header />
        </div>
        
        {/* Main Content */}
        <main className="p-4 lg:p-6 pt-20 lg:pt-24 print:p-0 print:pt-0">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden print:hidden"
          onClick={() => useUIStore.getState().setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
