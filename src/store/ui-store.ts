import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Theme & Layout
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  
  // Modals & Dialogs
  modals: {
    addProduct: boolean
    editProduct: boolean
    addCustomer: boolean
    editCustomer: boolean
    confirmDialog: boolean
    imageViewer: boolean
    barcodeScanner: boolean
    settings: boolean
  }
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>
  
  // Loading States
  loadingStates: {
    products: boolean
    sales: boolean
    customers: boolean
    reports: boolean
    backup: boolean
  }
  
  // Current View
  currentPage: string
  breadcrumbs: Array<{ label: string; href?: string }>
  
  // Search & Filters
  globalSearch: string
  
  // Actions
  initialize: () => void
  
  // Theme & Layout
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  
  // Modals
  openModal: (modalName: keyof UIState['modals']) => void
  closeModal: (modalName: keyof UIState['modals']) => void
  closeAllModals: () => void
  
  // Notifications
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  removeNotification: (id: string) => void
  
  // Loading States
  setLoading: (key: keyof UIState['loadingStates'], loading: boolean) => void
  
  // Navigation
  setCurrentPage: (page: string) => void
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void
  
  // Search
  setGlobalSearch: (search: string) => void
  
  // Computed
  getUnreadNotificationCount: () => number
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial State
      theme: 'light',
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      
      modals: {
        addProduct: false,
        editProduct: false,
        addCustomer: false,
        editCustomer: false,
        confirmDialog: false,
        imageViewer: false,
        barcodeScanner: false,
        settings: false,
      },
      
      notifications: [],
      
      loadingStates: {
        products: false,
        sales: false,
        customers: false,
        reports: false,
        backup: false,
      },
      
      currentPage: 'dashboard',
      breadcrumbs: [{ label: 'Dashboard' }],
      globalSearch: '',
      
      // Actions
      initialize: () => {
        // Initialize UI store
        set({ currentPage: 'dashboard' })
      },
      
      // Theme & Layout
      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      
      // Modals
      openModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: true }
      })),
      
      closeModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: false }
      })),
      
      closeAllModals: () => set((state) => ({
        modals: Object.keys(state.modals).reduce((acc, key) => ({
          ...acc,
          [key]: false
        }), {} as UIState['modals'])
      })),
      
      // Notifications
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          notifications: [
            {
              ...notification,
              id,
              timestamp: new Date(),
              read: false,
            },
            ...state.notifications
          ].slice(0, 50) // Keep only last 50 notifications
        }))
        
        // Auto-remove success notifications after 5 seconds
        if (notification.type === 'success') {
          setTimeout(() => {
            get().removeNotification(id)
          }, 5000)
        }
      },
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== id)
      })),
      
      // Loading States
      setLoading: (key, loading) => set((state) => ({
        loadingStates: { ...state.loadingStates, [key]: loading }
      })),
      
      // Navigation
      setCurrentPage: (page) => set({ currentPage: page }),
      
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      
      // Search
      setGlobalSearch: (search) => set({ globalSearch: search }),
      
      // Computed
      getUnreadNotificationCount: () => {
        const state = get()
        return state.notifications.filter(n => !n.read).length
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        // Persist UI preferences
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        globalSearch: state.globalSearch,
      })
    }
  )
)
