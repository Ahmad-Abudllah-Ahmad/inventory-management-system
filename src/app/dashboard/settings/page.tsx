'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  Building, 
  DollarSign, 
  Bell, 
  Shield, 
  Database,
  Save,
  Download,
  Upload,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)

  // Mock settings data
  const [businessSettings, setBusinessSettings] = useState({
    name: 'Al Umer Grocery',
    address: 'Lahore, Pakistan',
    phone: '+92-XXX-XXXXXXX',
    email: 'info@alumergrocery.com',
    website: 'www.alumergrocery.com',
    taxRate: 17,
    currency: 'PKR',
    timezone: 'Asia/Karachi'
  })

  const [systemSettings, setSystemSettings] = useState({
    backupFrequency: 'daily',
    backupRetention: 30,
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    autoBackup: true
  })

  const [userSettings, setUserSettings] = useState({
    theme: 'light',
    language: 'en',
    notifications: true,
    emailUpdates: true,
    twoFactorAuth: false
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        const json = await res.json()
        if (res.ok && json.data) {
          if (json.data.business) {
            setBusinessSettings(prev => ({ ...prev, ...json.data.business }))
          }
          if (json.data.system) {
            setSystemSettings(prev => ({ ...prev, ...json.data.system }))
          }
          if (json.data.user) {
            setUserSettings(prev => ({ ...prev, ...json.data.user }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings', error)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any[] = []
      
      // Map business settings
      Object.entries(businessSettings).forEach(([k, v]) => {
        payload.push({ key: k, value: v, type: typeof v === 'number' ? 'number' : 'string', category: 'business' })
      })

      // Map system settings
      Object.entries(systemSettings).forEach(([k, v]) => {
        payload.push({ key: k, value: v, type: typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? 'number' : 'string', category: 'system' })
      })

      // Map user settings
      Object.entries(userSettings).forEach(([k, v]) => {
        payload.push({ key: k, value: v, type: typeof v === 'boolean' ? 'boolean' : 'string', category: 'user' })
      })

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred while saving settings')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'business', label: 'Business Settings', icon: Building },
    ...(user?.role !== 'MANAGER' ? [
      { id: 'system', label: 'System Settings', icon: Settings },
      { id: 'user', label: 'User Preferences', icon: Shield },
      { id: 'backup', label: 'Backup & Restore', icon: Database }
    ] : [])
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your system preferences and business settings
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Business Settings */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Business Information</span>
              </CardTitle>
              <CardDescription>
                Configure your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessSettings.name}
                    onChange={(e) => setBusinessSettings({...businessSettings, name: e.target.value})}
                    placeholder="Enter business name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email Address</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings({...businessSettings, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Phone Number</Label>
                  <Input
                    id="businessPhone"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings({...businessSettings, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessWebsite">Website</Label>
                  <Input
                    id="businessWebsite"
                    value={businessSettings.website}
                    onChange={(e) => setBusinessSettings({...businessSettings, website: e.target.value})}
                    placeholder="Enter website URL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Address</Label>
                  <Input
                    id="businessAddress"
                    value={businessSettings.address}
                    onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
                    placeholder="Enter business address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessTimezone">Timezone</Label>
                  <Input
                    id="businessTimezone"
                    value={businessSettings.timezone}
                    onChange={(e) => setBusinessSettings({...businessSettings, timezone: e.target.value})}
                    placeholder="Enter timezone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Financial Settings</span>
              </CardTitle>
              <CardDescription>
                Configure tax rates, currency, and financial preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={businessSettings.taxRate}
                    onChange={(e) => setBusinessSettings({...businessSettings, taxRate: parseFloat(e.target.value)})}
                    placeholder="Enter tax rate"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={businessSettings.currency}
                    onChange={(e) => setBusinessSettings({...businessSettings, currency: e.target.value})}
                    placeholder="Enter currency code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Settings */}
      {activeTab === 'system' && user?.role !== 'MANAGER' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>System Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure system behavior and automation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <select
                    id="backupFrequency"
                    value={systemSettings.backupFrequency}
                    onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={systemSettings.backupRetention}
                    onChange={(e) => setSystemSettings({...systemSettings, backupRetention: parseInt(e.target.value)})}
                    placeholder="Enter retention days"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                  </div>
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={systemSettings.emailNotifications}
                    onChange={(e) => setSystemSettings({...systemSettings, emailNotifications: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive SMS alerts for critical events</p>
                  </div>
                  <input
                    id="smsNotifications"
                    type="checkbox"
                    checked={systemSettings.smsNotifications}
                    onChange={(e) => setSystemSettings({...systemSettings, smsNotifications: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                  </div>
                  <input
                    id="lowStockAlerts"
                    type="checkbox"
                    checked={systemSettings.lowStockAlerts}
                    onChange={(e) => setSystemSettings({...systemSettings, lowStockAlerts: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBackup">Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup data at scheduled intervals</p>
                  </div>
                  <input
                    id="autoBackup"
                    type="checkbox"
                    checked={systemSettings.autoBackup}
                    onChange={(e) => setSystemSettings({...systemSettings, autoBackup: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Preferences */}
      {activeTab === 'user' && user?.role !== 'MANAGER' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>User Preferences</span>
              </CardTitle>
              <CardDescription>
                Configure your personal settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={userSettings.theme}
                    onChange={(e) => setUserSettings({...userSettings, theme: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={userSettings.language}
                    onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
                  </div>
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={userSettings.notifications}
                    onChange={(e) => setUserSettings({...userSettings, notifications: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailUpdates">Email Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about system changes</p>
                  </div>
                  <input
                    id="emailUpdates"
                    type="checkbox"
                    checked={userSettings.emailUpdates}
                    onChange={(e) => setUserSettings({...userSettings, emailUpdates: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Enable additional security for your account</p>
                  </div>
                  <input
                    id="twoFactorAuth"
                    type="checkbox"
                    checked={userSettings.twoFactorAuth}
                    onChange={(e) => setUserSettings({...userSettings, twoFactorAuth: e.target.checked})}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backup & Restore */}
      {activeTab === 'backup' && user?.role !== 'MANAGER' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Backup & Restore</span>
              </CardTitle>
              <CardDescription>
                Manage your data backups and restore points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Create Backup</span>
                  <span className="text-xs text-muted-foreground">Backup all data</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Upload className="w-6 h-6 mb-2" />
                  <span>Restore Data</span>
                  <span className="text-xs text-muted-foreground">Restore from backup</span>
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Recent Backups</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Backup_2024_01_15_10_30</p>
                      <p className="text-sm text-muted-foreground">January 15, 2024 at 10:30 AM</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Restore</Button>
                      <Button size="sm" variant="outline">Download</Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Backup_2024_01_14_15_20</p>
                      <p className="text-sm text-muted-foreground">January 14, 2024 at 3:20 PM</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Restore</Button>
                      <Button size="sm" variant="outline">Download</Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 