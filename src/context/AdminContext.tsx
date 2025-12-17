import { createContext, useContext, useState, ReactNode } from 'react'
import { Admin } from '@/types'

interface AdminContextType {
  admin: Admin | null
  setAdmin: (admin: Admin | null) => void
  isLoggedIn: boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)

  const logout = () => {
    setAdmin(null)
  }

  return (
    <AdminContext.Provider value={{ admin, setAdmin, isLoggedIn: !!admin, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
