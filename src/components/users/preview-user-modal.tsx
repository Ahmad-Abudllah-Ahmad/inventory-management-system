'use client'

import React from 'react'
import { X, User, Mail, Phone, Calendar, Shield, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
  role: string
  phone?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

interface PreviewUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserData | null
}

export function PreviewUserModal({ isOpen, onClose, user }: PreviewUserModalProps) {
  if (!isOpen || !user) return null

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-red-100 text-red-800 border-none">Super Admin</Badge>
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800 border-none">Admin</Badge>
      case 'MANAGER':
        return <Badge className="bg-blue-100 text-blue-800 border-none">Manager</Badge>
      case 'STAFF':
        return <Badge className="bg-green-100 text-green-800 border-none">Staff</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-none">{role}</Badge>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">User Details</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
              {user.firstName.charAt(0)}{user.lastName?.charAt(0) || ''}
            </div>
            <h3 className="text-xl font-semibold">{user.firstName} {user.lastName}</h3>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
            <div className="mt-3 flex gap-2">
              {getRoleBadge(user.role)}
              <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-green-100 text-green-800 border-none' : 'bg-gray-100 text-gray-800 border-none'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{user.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">{user.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">System Role</p>
                <p className="text-sm text-muted-foreground capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-sm text-muted-foreground">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/10 flex justify-end shrink-0">
          <Button type="button" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
