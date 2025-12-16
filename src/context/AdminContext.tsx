import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Admin } from '@/types'

interface AdminContextType {
  admin: Admin | null
  setAdmin: (admin: Admin | null) => void
  isLoggedIn: boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const saved = localStorage.getItem('volunteer_admin')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (admin) {
      localStorage.setItem('volunteer_admin', JSON.stringify(admin))
    } else {
      localStorage.removeItem('volunteer_admin')
    }
  }, [admin])

  const logout = () => {
    setAdmin(null)
    localStorage.removeItem('volunteer_admin')
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
