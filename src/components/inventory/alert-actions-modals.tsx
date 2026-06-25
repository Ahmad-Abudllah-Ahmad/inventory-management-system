'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, Package, Bell, Clock, Search, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  sku: string
  currentStock: number
}

// ----------------------------------------------------------------------
// RESTOCK MODAL
// ----------------------------------------------------------------------
interface RestockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RestockModal({ isOpen, onClose, onSuccess }: RestockModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    notes: 'Restocked via Quick Actions'
  })

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products?limit=1000')
        .then(res => res.json())
        .then(data => {
          if (data.data) setProducts(data.data)
        })
        .catch(err => console.error(err))
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productId || formData.quantity <= 0) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          type: 'IN',
          quantity: formData.quantity,
          notes: formData.notes
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to restock product')
      
      toast.success('Inventory restocked successfully!')
      setFormData({ productId: '', quantity: 1, notes: 'Restocked via Quick Actions' })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Restock Items</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <select 
                value={formData.productId} 
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })} 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a product to restock...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Current: {p.currentStock}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantity to Add</Label>
              <Input 
                type="number" 
                min="1" 
                value={formData.quantity} 
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input 
                type="text" 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
              />
            </div>
          </div>
          <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !formData.productId}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Add Inventory'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// NOTIFICATION SETTINGS MODAL
// ----------------------------------------------------------------------
interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    dailyDigest: true,
    lowStockThreshold: 10
  })

  useEffect(() => {
    const saved = localStorage.getItem('inventory_notification_settings')
    if (saved) setSettings(JSON.parse(saved))
  }, [isOpen])

  const handleSave = () => {
    localStorage.setItem('inventory_notification_settings', JSON.stringify(settings))
    toast.success('Notification settings saved securely to browser!')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Notification Settings</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Email Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive critical stock alerts via email.</p>
              </div>
              <input type="checkbox" className="w-4 h-4" checked={settings.emailAlerts} onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked})} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">SMS Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive texts for out-of-stock items.</p>
              </div>
              <input type="checkbox" className="w-4 h-4" checked={settings.smsAlerts} onChange={(e) => setSettings({...settings, smsAlerts: e.target.checked})} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Daily Digest</Label>
                <p className="text-xs text-muted-foreground">A morning summary of all active alerts.</p>
              </div>
              <input type="checkbox" className="w-4 h-4" checked={settings.dailyDigest} onChange={(e) => setSettings({...settings, dailyDigest: e.target.checked})} />
            </div>
            <div className="pt-4 border-t">
              <Label className="text-base block mb-2">Global Low Stock Threshold</Label>
              <p className="text-xs text-muted-foreground mb-3">Default minimum limit before triggering an alert.</p>
              <Input 
                type="number" 
                value={settings.lowStockThreshold} 
                onChange={(e) => setSettings({...settings, lowStockThreshold: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// ALERT HISTORY MODAL
// ----------------------------------------------------------------------
interface AlertHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AlertHistoryModal({ isOpen, onClose }: AlertHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Fetch resolved alerts (isRead=true OR isActive=false)
      fetch('/api/stock-alerts?limit=50&isRead=true')
        .then(res => res.json())
        .then(data => {
          if (data.data) setHistory(data.data)
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Alert History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No past alerts found.</div>
          ) : (
            history.map(alert => (
              <div key={alert.id} className="p-4 border rounded-lg flex items-start gap-4 bg-muted/10">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{alert.productName}</span>
                    <Badge variant="outline" className="text-xs">{alert.alertType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">Resolved on {new Date(alert.lastUpdated).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-6 border-t bg-muted/20 flex justify-end shrink-0">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
