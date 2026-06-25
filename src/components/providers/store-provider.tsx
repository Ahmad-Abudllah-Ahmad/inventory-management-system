'use client'

import React, { ReactNode, useEffect } from 'react'
import { useInventoryStore } from '@/store/inventory-store'
import { usePOSStore } from '@/store/pos-store'
import { useUIStore } from '@/store/ui-store'

interface StoreProviderProps {
  children: ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  // Initialize stores on mount
  const initInventory = useInventoryStore((state) => state.initialize)
  const initPOS = usePOSStore((state) => state.initialize) 
  const initUI = useUIStore((state) => state.initialize)

  // Initialize stores
  useEffect(() => {
    initInventory()
    initPOS()
    initUI()
  }, [initInventory, initPOS, initUI])

  return <>{children}</>
}
